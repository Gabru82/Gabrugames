document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector(".startbutton");
  const reels = document.querySelectorAll(".fruitbar > div");
  const balanceEl = document.querySelector(".balance h1");
  const balanceElmb = document.querySelector(".balancemb h1");
  const winEl = document.querySelector(".win-amount");

  // Jackpot elements
  const grandEl = document.querySelector(".menubar1 h1");
  const majorEl = document.querySelector(".menubar2 h1");
  const minorEl = document.querySelector(".menubar3 h1");
  const miniEl = document.querySelector(".menubar4 h1");

  let spinning = false;
  let balance = 5000.0;
  let jackpotIntervals = [];
  let totalMatchedFruits = 0;

  // 🎯 MANUAL WIN CHANCE (0–100)
  let winChance = 30; // 100 = always force a win
  let forcedPattern = "random"; // "row" | "diagRight" | "diagLeft" | "random"
  let forcedRowIndex = 0; // 0 = top, 1 = middle, 2 = bottom (used for row wins)
  const betBtn = document.getElementById("betbtn");
  const betPopup = document.getElementById("betPopup");
  const closePopup = document.getElementById("closePopup");

  // Show popup
  betBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent window click from firing
    betPopup.style.visibility = "visible";
  });

  // Close popup via close button
  closePopup.addEventListener("click", (e) => {
    e.stopPropagation();
    betPopup.style.visibility = "hidden";
  });

  // Prevent clicks inside popup from closing it
  betPopup.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close when clicking outside
  window.addEventListener("click", () => {
    betPopup.style.visibility = "hidden";
  });

  const betAmountsDiv = document.getElementById("betAmounts");
  const optionButtons = document.querySelectorAll(".option-btn");
  const selectedBetDisplay = document.getElementById("selectedBet");
  const bottomBetBtns = document.querySelectorAll(".bottombet button"); // 👈 get bottom buttons
  const bottomBetBtnsmb = document.querySelectorAll(".bottombetmb button"); // 👈 get bottom buttons

  let betAmount = 0;

  // Bet Options with different sets of amounts
  const betOptions = {
    1: [2.5, 5, 7.5, 10, 12.5],
    2: [5, 10, 15, 20, 25],
    3: [10, 20, 30, 40, 50],
    4: [12.5, 25, 37.5, 50, 62.5],
    5: [15, 30, 45, 60, 75],
    6: [25, 50, 75, 100, 125],
  };

  // When user clicks a bet option
  // When user clicks a bet option
  optionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      optionButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const option = btn.dataset.option;
      const amounts = betOptions[option];

      // 🔹 Update popup bet buttons
      betAmountsDiv.innerHTML = "";
      amounts.forEach((amount) => {
        const betBtn = document.createElement("button");
        betBtn.className = "bet-btn";
        betBtn.dataset.amount = amount;

        betBtn.innerHTML = `
        <div class="bet-currency">INR</div>
        <div class="bet-value">${amount.toFixed(2)}</div>
        <div class="bet-label">BET</div>
      `;

        betBtn.addEventListener("click", () => {
          document
            .querySelectorAll(".bet-btn")
            .forEach((b) => b.classList.remove("active"));
          betBtn.classList.add("active");
          betAmount = amount;
          selectedBetDisplay.textContent = betAmount.toFixed(2);

          // 🔹 Sync with bottom bet buttons
          [...bottomBetBtns, ...bottomBetBtnsmb].forEach((b) => {
            b.classList.remove("active");
            if (parseFloat(b.dataset.amount) === betAmount) {
              b.classList.add("active");
            }
          });
        });

        betAmountsDiv.appendChild(betBtn);
      });

      // 🔹 Update bottom bet buttons (desktop + mobile)
      function updateBottomButtons(btnGroup) {
        btnGroup.forEach((btn, i) => {
          if (amounts[i] !== undefined) {
            const amount = amounts[i];
            btn.dataset.amount = amount;
            btn.innerHTML = `
            <div class="bet-currency">INR</div>
            <div class="bet-value">${amount.toFixed(2)}</div>
            <div class="bet-label">BET</div>
          `;
          } else {
            btn.removeAttribute("data-amount");
            btn.innerHTML = `<div class="bet-empty">-</div>`;
          }
        });
      }
      updateBottomButtons(bottomBetBtns);
      updateBottomButtons(bottomBetBtnsmb);
    });
  });

  // 🔹 Handle bottom bet button clicks (desktop + mobile)
  function setupBottomButtonEvents(btnGroup) {
    btnGroup.forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = parseFloat(btn.dataset.amount);
        if (!isNaN(value)) {
          betAmount = value;
          selectedBetDisplay.textContent = betAmount.toFixed(2);

          // highlight this group
          btnGroup.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // highlight other bottom group (sync desktop & mobile)
          const otherGroup =
            btnGroup === bottomBetBtns ? bottomBetBtnsmb : bottomBetBtns;
          otherGroup.forEach((b) => {
            b.classList.remove("active");
            if (parseFloat(b.dataset.amount) === betAmount) {
              b.classList.add("active");
            }
          });

          // highlight popup buttons
          document.querySelectorAll(".bet-btn").forEach((b) => {
            b.classList.remove("active");
            if (parseFloat(b.dataset.amount) === betAmount) {
              b.classList.add("active");
            }
          });

          // ✅ Immediately start game
          startGame();
        }
      });
    });
  }
  setupBottomButtonEvents(bottomBetBtns);
  setupBottomButtonEvents(bottomBetBtnsmb);

  // Duplicate symbols for smooth loop (use the same NodeList we're spinning)
  Array.from(reels).forEach((reel) => {
    const symbols = reel.innerHTML;
    reel.innerHTML += symbols;
  });

  // ---- Helpers for forcing a win ----
  // forcePlan: {active, pattern, targetSrc, stopIndexes:number[]}
  let forcePlan = null;

  function getFirstHalfImgSrcs(reel) {
    const half = reel.children.length / 2;
    const res = [];
    for (let i = 0; i < half; i++) {
      const img = reel.children[i]?.querySelector("img");
      if (img && img.src) res.push(img.src);
    }
    return res;
  }

  function findIndexOfSrcInFirstHalf(reel, targetSrc) {
    const half = reel.children.length / 2;
    for (let i = 0; i < half; i++) {
      const img = reel.children[i]?.querySelector("img");
      if (img && img.src === targetSrc) return i;
    }
    return -1;
  }

  function intersection(a, b) {
    const setB = new Set(b);
    return a.filter((x) => setB.has(x));
  }

  function choosePattern() {
    if (forcedPattern === "random") {
      const choices = ["row", "diagRight", "diagLeft"];
      return choices[Math.floor(Math.random() * choices.length)];
    }
    return forcedPattern; // fixed by user
  }

  function planForcedWin(pattern) {
    // Force across ALL reels now (not just 3)
    const reelCount = reels.length;

    // Collect available symbols in each reel
    const reelSymbols = Array.from(reels).map(getFirstHalfImgSrcs);

    // Find a symbol that exists in every reel
    let common = reelSymbols.reduce((a, b) => intersection(a, b));
    if (common.length === 0) return null;

    const targetSrc = common[Math.floor(Math.random() * common.length)];
    const stopIndexes = new Array(reelCount).fill(null);

    // 🎯 Decide diagonal length: between 3 and reelCount (5)
    const diagLength = Math.floor(Math.random() * (reelCount - 2)) + 3;

    for (let i = 0; i < diagLength; i++) {
      const reel = reels[i];
      const half = reel.children.length / 2;
      const symIndex = findIndexOfSrcInFirstHalf(reel, targetSrc);
      if (symIndex === -1) return null;

      let desiredRow;
      if (pattern === "row") {
        desiredRow = forcedRowIndex;
      } else if (pattern === "diagRight") {
        desiredRow = i; // ↘ downwards
      } else if (pattern === "diagLeft") {
        desiredRow = 2 - i; // ↙ upwards
      } else {
        desiredRow = forcedRowIndex;
      }

      const baseIndex = (symIndex - desiredRow + half) % half;
      stopIndexes[i] = baseIndex;
    }

    // Remaining reels (if > diagLength) stop randomly
    for (let i = diagLength; i < reelCount; i++) {
      const half = reels[i].children.length / 2;
      stopIndexes[i] = Math.floor(Math.random() * half);
    }

    return { active: true, pattern, targetSrc, stopIndexes };
  }
  function updateBetLabel(labelText) {
    [bottomBetBtns, bottomBetBtnsmb].forEach((btnGroup) => {
      btnGroup.forEach((btn) => {
        if (parseFloat(btn.dataset.amount) === betAmount) {
          const label = btn.querySelector(".bet-label");
          if (label) label.textContent = labelText;
        }
      });
    });
  }

  const autoplayBtn = document.getElementById("autoplay");
  const autobtnsBox = document.querySelector(".autobtns");
  const autoButtons = autobtnsBox.querySelectorAll("button");

  const selectedCountDisplay = document.getElementById("selectedCount");
  const remainingCountDisplay = document.getElementById("remainingCount");
  const autoplayStatusBox = document.getElementById("autoplayStatus");

  let autoPlayCount = 0;
  let autoPlayActive = false;
  let roundsPlayed = 0;

  // Show/hide autoplay options
  autoplayBtn.addEventListener("click", () => {
    autobtnsBox.classList.toggle("show");
  });

  // Handle autoplay selection
  autoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      autoPlayCount = parseInt(btn.textContent);
      roundsPlayed = 0;

      selectedCountDisplay.textContent = autoPlayCount;
      remainingCountDisplay.textContent = autoPlayCount;

      autoplayStatusBox.style.display = "block"; // 👈 Show status box
      autobtnsBox.classList.remove("show");

      runAutoplay(autoPlayCount);
    });
  });

  // Autoplay loop
  function runAutoplay(count) {
    if (autoPlayActive || spinning) return;
    autoPlayActive = true;

    let spinsLeft = count;

    const autoplayInterval = setInterval(() => {
      if (spinsLeft <= 0) {
        clearInterval(autoplayInterval);
        autoPlayActive = false;

        autoplayStatusBox.style.display = "none"; // 👈 Hide status box
        return;
      }

      if (!spinning) {
        startGame(); // Your game logic
        spinsLeft--;
        roundsPlayed++;

        remainingCountDisplay.textContent = autoPlayCount - roundsPlayed;
      }
    }, 1500);
  }
  // ---- Spin / Stop ----
  function startGame() {
    if (spinning) return;
    if (balance < betAmount) {
      alert("Not enough balance!");
      return;
    }
    if (betAmount <= 0) {
      alert("Please select a bet amount before playing!");
      return;
    }
    if (balance < betAmount) {
      alert("Not enough balance!");
      return;
    }

    spinning = true;
    startBtn.style.opacity = "0.6";

    // 🔹 Change selected bet button label to PLAY
    updateBetLabel("PLAY");

    // Deduct bet immediately
    balance -= betAmount;
    updateBalance();

    // --- WIN CHANCE DECISION ---
    forcePlan = null;
    const shouldForce = Math.random() * 100 < winChance;

    // // prepare API payload
    // const token = sessionStorage.getItem("token") || "RBQJVNKQHOBZLTH";
    // const gamename = "testing";

    // const payload = {
    //   token: token,
    //   betamount: betAmount,
    //   gamename: gamename,
    //   result: shouldForce ? "win" : "lose", // 👈 tell API outcome
    // };

    // // ✅ Always call API per spin (not just first click now)
    // fetch("https://funtarget.gamesterclub.com/slotsbet", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     console.log("✅ Betting API Response:", data);

    //     if (data.status === 1) {
    //       // update win display from API
    //       winEl.textContent = data.winamount;

    //       // update balance
    //       balance += data.winamount;
    //       updateBalance();

    //       // optional: show multiplier
    //       console.log("Multiplier:", data.xvalue + "x");
    //     } else {
    //       alert("Bet failed: " + (data.message || "Unknown error"));
    //     }
    //   })
    //   .catch((err) => console.error("API Error:", err));

    if (shouldForce) {
      const pattern = choosePattern();
      const plan = planForcedWin(pattern);
      if (plan) forcePlan = plan;
    }

    // Start spinning
    reels.forEach((reel, index) => spinReel(reel, index));

    // Schedule stop
    setTimeout(() => {
      reels.forEach((reel, index) => stopReel(reel, index));
      setTimeout(() => {
        spinning = false;
        startBtn.style.opacity = "1";

        jackpotIntervals.forEach((i) => clearInterval(i));
        jackpotIntervals = [];

        checkWin();

        // 🔹 Restore bet button label to BET
        updateBetLabel("BET");
      }, reels.length * 500 + 500);
    }, 800);
  }

  startBtn.addEventListener("click", startGame);

  function spinReel(reel, index) {
    let speed = 35 + index * 0.5;
    let position = 0;

    function animate() {
      position -= speed;
      reel.style.transform = `translateY(${position}px)`;
      if (Math.abs(position) >= reel.scrollHeight / 2) position = 0;
      reel.spinFrame = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopReel(reel, index) {
    setTimeout(() => {
      cancelAnimationFrame(reel.spinFrame);

      const half = reel.children.length / 2;
      const symbolHeight = reel.children[0].offsetHeight || 0;

      // Use forced stop index for first 3 reels if plan is active
      let baseIndex;
      if (forcePlan?.active && forcePlan.stopIndexes[index] != null) {
        baseIndex = forcePlan.stopIndexes[index];
      } else {
        baseIndex = Math.floor(Math.random() * half);
      }

      const stopPosition = -(baseIndex * symbolHeight);
      reel.style.transition = "transform 0.6s ease-out";
      reel.style.transform = `translateY(${stopPosition}px)`;

      setTimeout(() => {
        reel.style.transition = "none";
        if (index === reels.length - 1) {
          // reset for next spin
          forcePlan = null;
        }
      }, 600);
    }, index * 500);
  }

  // ---- Jackpot animation ----
  let grandDecimal = 56;
  let majorDecimal = 56;
  let minorDecimal = 56;
  let miniDecimal = 56;

  function animateJackpot(element, intPart, decimalRef) {
    element.textContent = `${intPart}.${decimalRef.value
      .toString()
      .padStart(2, "0")}`;
    const interval = setInterval(() => {
      decimalRef.value++;
      if (decimalRef.value >= 100) {
        decimalRef.value = 0;
        intPart++;
      }
      element.textContent = `${intPart}.${decimalRef.value
        .toString()
        .padStart(2, "0")}`;
    }, 900);
    return interval;
  }

  const g = animateJackpot(grandEl, 12453, { value: grandDecimal });
  const j = animateJackpot(majorEl, 17463, { value: majorDecimal });
  const m = animateJackpot(minorEl, 64453, { value: minorDecimal });
  const n = animateJackpot(miniEl, 98453, { value: miniDecimal });

  function updateBalance() {
    balanceEl.textContent = balance.toFixed(2);
    balanceElmb.textContent = balance.toFixed(2);
  }

  function checkWin() {
    let winFound = false;
    let winAmount = 0;
    let fullRowCount = 0;

    function getVisibleSymbol(reel, rowIndex) {
      const symbols = reel.children.length / 2;
      const symbolHeight = reel.children[0].offsetHeight;
      const position = Math.abs(
        parseInt(
          reel.style.transform.replace("translateY(", "").replace("px)", "")
        ) || 0
      );
      const baseIndex = Math.round(position / symbolHeight);
      const index = (baseIndex + rowIndex) % symbols;
      return reel.children[index]?.querySelector("img") || null;
    }

    const visibleRows = [0, 1, 2].map((rowIndex) =>
      Array.from(reels).map((reel) => getVisibleSymbol(reel, rowIndex))
    );

    function flashHorizontalWin(img) {
      if (!img) return;
      img.classList.remove("horizontal-glow");
      void img.offsetWidth;
      img.classList.add("horizontal-glow");
      setTimeout(() => img.classList.remove("horizontal-glow"), 1500);
    }

    function flashDiagonalWin(img) {
      if (!img) return;
      img.classList.remove("diagonal-glow");
      void img.offsetWidth;
      img.classList.add("diagonal-glow");
      setTimeout(() => img.classList.remove("diagonal-glow"), 1500);
    }

    function isWild(img) {
      return img?.classList.contains("seven");
    }

    function addWin(streak, symbolImgs, glowType) {
      if (streak < 3) return;
      winFound = true;
      totalMatchedFruits += streak;

      if (streak === 3) winAmount += betAmount * 1.75;
      else if (streak === 4) winAmount += betAmount * 2;
      else if (streak >= 5) {
        winAmount += betAmount * 10;
        const bigWinPopup = document.getElementById("big-win-popup");
        bigWinPopup.style.display = "block";
        setTimeout(() => (bigWinPopup.style.display = "none"), 3000);
      }

      symbolImgs.forEach((img) => {
        if (glowType === "horizontal") flashHorizontalWin(img);
        else if (glowType === "diagonal") flashDiagonalWin(img);
      });
    }

    function checkLine(symbols, glowType) {
      if (symbols.length < 3) return;

      let baseSymbol = null;
      let streak = 0;
      const streakImgs = [];

      for (let i = 0; i < symbols.length; i++) {
        const current = symbols[i];
        if (!current) break;

        const isCurrentWild = isWild(current);

        if (baseSymbol === null && !isCurrentWild) {
          baseSymbol = current.src;
        }

        if (
          current.src === baseSymbol ||
          isCurrentWild ||
          (baseSymbol === null && !isCurrentWild)
        ) {
          if (baseSymbol === null && !isCurrentWild) {
            baseSymbol = current.src;
          }
          streak++;
          streakImgs.push(current);
        } else {
          break; // ❌ Stop streak when mismatch occurs
        }
      }

      if (streak >= 3) {
        winFound = true;
        totalMatchedFruits += streak;

        if (streak === 3) winAmount += betAmount * 1.75;
        else if (streak === 4) winAmount += betAmount * 2;
        else if (streak >= 5) {
          winAmount += betAmount * 10;
          const bigWinPopup = document.getElementById("big-win-popup");
          bigWinPopup.style.display = "block";
          setTimeout(() => (bigWinPopup.style.display = "none"), 3000);
        }

        streakImgs.forEach((img) => {
          if (glowType === "horizontal") flashHorizontalWin(img);
          else if (glowType === "diagonal") flashDiagonalWin(img);
        });
      }
    }
    function checkFullRow(row) {
      let firstSymbol = null;
      let allMatch = true;

      for (let i = 0; i < row.length; i++) {
        const img = row[i];
        if (!img) {
          allMatch = false;
          break;
        }
        if (firstSymbol === null && !isWild(img)) {
          firstSymbol = img.src;
        }
        if (img.src !== firstSymbol && !isWild(img)) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        fullRowCount++;
        winFound = true;
        row.forEach((img) => img && flashHorizontalWin(img));
      }
    }

    // Horizontal wins
    visibleRows.forEach((row) => checkLine(row, "horizontal"));

    // Full row checks
    visibleRows.forEach((row) => checkFullRow(row));

    // Diagonal helper
    function getDiagonal(startRow, direction) {
      const diagonal = [];
      for (let col = 0; col < visibleRows[0].length; col++) {
        const row = startRow + direction * col;
        if (row >= 0 && row < visibleRows.length) {
          const img = visibleRows[row][col];
          if (img) {
            diagonal.push(img);
          } else {
            break; // Stop if any symbol is missing
          }
        } else {
          break;
        }
      }
      return diagonal.length >= 3 ? diagonal : []; // Only return valid diagonals
    }
    // Diagonal ↘
    for (let startRow = 0; startRow < visibleRows.length; startRow++) {
      const diag = getDiagonal(startRow, 1);
      if (diag.length >= 3) checkLine(diag, "diagonal");
    }

    // Diagonal ↙
    for (let startRow = 0; startRow < visibleRows.length; startRow++) {
      const diag = getDiagonal(startRow, -1);
      if (diag.length >= 3) checkLine(diag, "diagonal");
    }

    // Win popups
    if (fullRowCount === 1) {
      winAmount += betAmount * 10;
      const bigWinPopup = document.getElementById("big-win-popup");
      bigWinPopup.style.display = "block";
      setTimeout(() => (bigWinPopup.style.display = "none"), 3000);
    } else if (fullRowCount === 2) {
      winAmount += betAmount * 20;
      const superWinPopup = document.getElementById("big-super-popup");
      superWinPopup.style.display = "block";
      setTimeout(() => (superWinPopup.style.display = "none"), 4000);
    } else if (fullRowCount === 3) {
      winAmount += betAmount * 30;
      const jackpotPopup = document.getElementById("jackpot-popup");
      jackpotPopup.style.display = "block";
      setTimeout(() => (jackpotPopup.style.display = "none"), 5000);
    }

    if (winFound) {
      balance += winAmount;
      updateBalance();
      winEl.textContent = winAmount.toFixed(2);
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const defaultBtn = document.querySelector('.option-btn[data-option="1"]');
  if (defaultBtn) {
    defaultBtn.click(); // triggers the same logic as manual click
  }
});
