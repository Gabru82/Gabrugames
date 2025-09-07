window.onload = function () {
  // 🔹 Select all DOM elements
  const betButton = document.querySelector(".betbtnplay");
  const cashButton = document.getElementById("cashout");
  const stopButton = document.getElementById("stop");
  const startButton = document.getElementById("startbtn");
  const tiles = document.querySelectorAll(".minestile");
  const gameOverPopup = document.getElementById("game-over-popup");
  const gameOverMsg = document.getElementById("game-over-message");
  const winPopup = document.getElementById("win-popup");
  const winMessage = document.getElementById("win-message");
  const betInput = document.getElementById("bet-amount");
  const autoGameBtn = document.getElementById("auto-game-btn");
  const randombtn = document.getElementById("randombtn");
  const multiplierText = document.querySelector(".minetext");
  const mineBtn = document.querySelector(".minebtn");
  const betPlusBtn = document.getElementById("betplus");
  const betMinusBtn = document.getElementById("betminus");
  const howToPlayBtn = document.getElementById("how-to-play-btn");
  const howplay = document.getElementById("howplay");
  const howToPlayPopup = document.getElementById("how-to-play-popup");
  const betbox = document.getElementById("bet-box");
  const closeHowToPlay = document.getElementById("close-how-to-play");
  const minBtn = document.getElementById("minbtn");
  const maxBtn = document.getElementById("maxbtn"); // Set minimum value = 10
  const coinbtn = document.getElementById("coinbtn");

  // 🔹 Game state variables
  let balance = 5000;
  let currentBet = 0;
  let gameStarted = false;
  let mineIndexes = [];
  let safeClicks = 0;
  let totalTiles = 25;
  let totalMines = 3;
  let autoGameRunning = false;
  let isAutoSelectingTiles = false;
  let selectedAutoTiles = [];
  let winAmount = 0;
  let useRandomTiles = false;
  let randomAutoMode = false;
  let autoTimeout = null; // To store auto game delay reference

  // 🔹 Displayed multipliers (UI)
  const shownMultipliers = {
    3: 1.8,
    4: 2.0,
    5: 2.3,
    6: 2.5,
    7: 2.8,
    8: 3.0,
    9: 3.3,
    10: 4.0,
  };

  // 🔹 Real payout multipliers
  const realMultipliers = {
    3: 1.5,
    4: 1.7,
    5: 2.0,
    6: 2.1,
    7: 2.3,
    8: 2.5,
    9: 2.8,
    10: 3.0,
  };

  // 🔹 Update multiplier text in UI
  function updateMultiplierText() {
    multiplierText.textContent = `NEXT: ${shownMultipliers[totalMines].toFixed(
      1
    )}x`;
  }

  // 🔹 Update mine button display
  function updateMineBtnText() {
    mineBtn.innerHTML = `MINES: ${totalMines} <i class="fa fa-arrow-down" aria-hidden="true"></i>`;
  }

  function playSoundEffect(soundPath) {
    const audio = new Audio(soundPath);
    audio.play().catch((err) => console.error("Audio play error:", err));
  }

  const mineInput = document.querySelector(".mineset");
  const numButtons = document.querySelectorAll(".minenum");
  const plusBtn = document.querySelector(".mineplus");
  const minusBtn = document.querySelector(".mineminus");

  // 🔹 Input field manual typing
  mineInput.addEventListener("input", () => {
    let val = parseInt(mineInput.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 24) val = 24; // adjust max
    totalMines = val;
    updateMineUI();
  });

  // keep input synced
  function updateMineUI() {
    mineInput.value = totalMines;
    updateMineBtnText();
    updateMultiplierText();
  }
  // 🔹 Number buttons (3, 4, 8, 9)
  numButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      totalMines = parseInt(btn.textContent);
      playSoundEffect("sound/minesbtn.wav");
      updateMineUI();
    });
  });
  // 🔹 Plus button
  plusBtn.addEventListener("click", () => {
    if (totalMines < 10) {
      // adjust max mines if needed
      totalMines++;
      playSoundEffect("sound/minesbtn.wav");
      updateMineUI();
    }
  });

  // 🔹 Minus button
  minusBtn.addEventListener("click", () => {
    if (totalMines > 3) {
      // adjust min mines if needed
      totalMines--;
      playSoundEffect("sound/minesbtn.wav");
      updateMineUI();
    }
  });

  coinbtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent it from triggering window click
    betbox.style.display = betbox.style.display === "block" ? "none" : "block";
    playSoundEffect("sound/buttonclick.wav");
  });

  // 🔹 Close when clicking outside
  window.addEventListener("click", (e) => {
    if (!betbox.contains(e.target) && e.target !== coinbtn) {
      betbox.style.display = "none";
    }
  });
  const betButtons = document.querySelectorAll(".bet-btn");

  betButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Set clicked value to input
      betInput.value = btn.textContent;

      // Remove active class from all buttons
      betButtons.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked one
      btn.classList.add("active");
      playSoundEffect("sound/buttonclick.wav");
    });
  });

  function disabledbtn() {
    betInput.disabled = true;
    betPlusBtn.disabled = true;
    betMinusBtn.disabled = true;
    mineBtn.disabled = true;
  }
  function Enabledbtn() {
    betInput.disabled = false;
    betPlusBtn.disabled = false;
    betMinusBtn.disabled = false;
    mineBtn.disabled = false;
  }
  function allenable() {
    autoGameBtn.disabled = false;
    randombtn.disabled = false;
    betInput.disabled = false;
    betPlusBtn.disabled = false;
    betMinusBtn.disabled = false;
    cashButton.disabled = false;
    mineBtn.disabled = false;
  }

  // 🔹 Update balance display
  // ...existing code...
  function updateBalance() {
    document.getElementById("total-balance").textContent = balance;
  }
  // ...existing code...

  // 🔹 Randomly generate mine positions
  function generateMines() {
    mineIndexes = [];
    while (mineIndexes.length < totalMines) {
      let index = Math.floor(Math.random() * totalTiles);
      if (!mineIndexes.includes(index)) mineIndexes.push(index);
    }
  }

  // 🔹 Update live win preview (UI)
  function updateLiveWin() {
    const liveWinElement = document.querySelector(".live-win");
    const realMultiplier = realMultipliers[totalMines];
    const profit = Math.floor(currentBet * (safeClicks * 0.1 * realMultiplier));
    if (liveWinElement) liveWinElement.textContent = `(₹${profit})`;
  }

  // 🔹 Handles what happens when player hits a mine
  function gameOver() {
    gameStarted = false;

    // Only show win amount if all safe tiles were opened (full win)
    if (winAmount > 0 && safeClicks + totalMines === totalTiles) {
      updateWallet(balance + winAmount);
      winAmount = 0;
    }

    // Show all mine tiles
    tiles.forEach((tile, index) => {
      if (mineIndexes.includes(index)) {
        tile.classList.add("flipping");
        tile.innerHTML =
          '<i class="fa fa-circle" aria-hidden="true" style="visibility:hidden;"></i>';

        // 🔥 Fire on clicked tile, 💣 Bomb on others
        tile.style.backgroundImage =
          index === clickedDangerIndex
            ? "url('mineimg/Fire.webp')"
            : "url('/mineimg/Bomb.webp')";

        tile.style.backgroundSize = "contain";
        tile.style.backgroundRepeat = "no-repeat";
        tile.style.backgroundPosition = "center";
        tile.style.backgroundColor = "#ff4d4d";
      }
      tile.onclick = null;
    });

    gameOverMsg.innerText = "💥 GAME OVER 💥";
    gameOverPopup.style.display = "flex";
    cashButton.style.display = "none";
    betButton.style.display = "inline-block";

    // Hide popup after short delay
    setTimeout(() => {
      gameOverPopup.style.display = "none";
    }, 1500);
  }

  function checkWinCondition() {
    const totalSafeTiles = totalTiles - totalMines;
    if (safeClicks >= totalSafeTiles) {
      winMessage.innerText = `You cleared all safe tiles 🎉`;
      winPopup.style.display = "flex";

      balance += currentBet * realMultipliers[totalMines];
      updateBalance();

      setTimeout(() => {
        winPopup.style.display = "none";
        if (autoGameRunning || randomAutoMode) {
          proceedToNextAutoRound();
        } else {
          resetGame();
        }
      }, 2000);
    }
  }

  // toast popup//
  function showToast(message) {
    const toast = document.getElementById("toast-notification");
    toast.textContent = message;
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 2500); // 2.5 seconds
  }

  // 🔹 Reset game to initial state
  function resetGame() {
    resetPeriodid();
    isFirstClick = true; // flag to detect first click

    gameStarted = false;
    mineIndexes = [];
    safeClicks = 0;
    winAmount = 0;
    useRandomTiles = false;

    tiles.forEach((tile) => {
      tile.classList.remove("flipping");
      tile.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
      tile.style.backgroundColor = "";
      tile.style.backgroundImage = "url('')";

      tile.style.outline = "";
      tile.onclick = null;
    });
  }

  // 🔹 Handle cash out (manual or auto)
  function cashOut() {
    const realMultiplier = realMultipliers[totalMines];
    const profit = Math.floor(currentBet * (safeClicks * 0.1 * realMultiplier));
    const totalWin = currentBet + profit;

    balance += totalWin;
    updateBalance();

    winMessage.innerText = `You won ₹${profit} 🎉`;
    winPopup.style.display = "flex";

    setTimeout(() => {
      winPopup.style.display = "none";
      betButton.innerHTML = "BET";
      resetGame();
    }, 2000);
  }

  function updateWinAmount() {
    document.getElementById("win-amount").innerText =
      winAmount > 0 ? `+ ₹${winAmount}` : "";
    if (winAmount === 0) {
      document.querySelector(".betbtnplay").innerText = "BET";
    }
  }
  stopButton.addEventListener("click", () => {
    // Signal to stop after the current round
    autoGameRunning = false;
    isAutoSelectingTiles = false;
    autoGameBtn.style.backgroundColor = ""; // reset to default
    autoGameActive = false;
    randomAutoMode = false;
    useRandomTiles = false;
    randombtn.style.backgroundColor = ""; // reset to default
    randomModeActive = false;
    setTimeout(() => {
      allenable();
    }, 2000);
  });
  // 🔹 Flip tiles in auto mode (one by one)
  function flipAutoTiles() {
    let i = 0;
    safeClicks = 0;
    generateMines();
    gameStarted = true;

    function flipNextTile() {
      if (i >= selectedAutoTiles.length || !autoGameRunning) return;

      const index = selectedAutoTiles[i];
      const tile = tiles[index];

      if (mineIndexes.includes(index)) {
        tile.innerHTML = "💣";
        tile.style.backgroundColor = "#ff4d4d";
        gameOver();

        // ✅ Wait 2s then auto next or reset manually
        setTimeout(() => {
          gameOverPopup.style.display = "none";
          if (autoGameRunning || randomAutoMode) {
            proceedToNextAutoRound();
          } else {
            resetGame();
          }
        }, 2000);
        return;
      } else {
        tile.innerHTML = "⭐";
        tile.style.backgroundColor = "#00cc99";
        tile.classList.add("flipped");
        safeClicks++;
        updateLiveWin();
        checkWinCondition();

        winAmount = Math.floor(
          currentBet *
            realMultipliers[totalMines] *
            (safeClicks / selectedAutoTiles.length)
        );
        betButton.innerHTML = `CASH OUT <span class="live-win">(₹${winAmount})</span>`;
      }

      i++;
      setTimeout(flipNextTile, 500);
    }

    flipNextTile();

    // ✅ Only trigger this if player survives all flips
    setTimeout(() => {
      if (
        autoGameRunning &&
        gameStarted &&
        safeClicks === selectedAutoTiles.length
      ) {
        balance += winAmount;
        updateBalance();
        winAmount = 0;
        betButton.innerHTML = `CASH OUT <span class="live-win">(₹0)</span>`;

        autoTimeout = setTimeout(() => {
          resetGame();
          currentBet = parseInt(betInput.value);
          if (balance >= currentBet) {
            balance -= currentBet;
            updateBalance();

            // 🎲 Randomize tiles if needed
            if (randomAutoMode) {
              selectedAutoTiles = [];
              while (selectedAutoTiles.length < 5) {
                const randIndex = Math.floor(Math.random() * totalTiles);
                if (!selectedAutoTiles.includes(randIndex)) {
                  selectedAutoTiles.push(randIndex);
                }
              }
            }

            flipAutoTiles();
          } else {
            autoGameRunning = false;
            showToast("Not enough balance to continue auto play.");
          }
        }, 2000); // 2 second delay between auto rounds
      }
    }, selectedAutoTiles.length * 500 + 800); // ⏱️ wait for animation to complete
  }

  // 🔹 Activate random auto mode
  document.querySelector(".randombtn").addEventListener("click", () => {
    useRandomTiles = true;
    randomAutoMode = true;
    selectedAutoTiles = [];
    resetGame();
    showToast("Random mode activated. Click BET to start Auto Game.");
  });

  // 🔹 Manual tile selection for auto game

  autoGameBtn.addEventListener("click", () => {
    if (!autoGameActive) {
      // 🔹 Activate Auto Game mode
      selectedAutoTiles = [];
      isAutoSelectingTiles = true;
      autoGameRunning = false;
      randomAutoMode = false;
      useRandomTiles = false;
      autoGameBtn.style.backgroundColor = "green";
      betButton.style.display = "none";
      startButton.disabled = true;
      startButton.style.display = "block";
      resetGame();
      showToast("Auto Game activated. Select tiles, then click BET.");

      // Enable tile selection only in auto mode
      tiles.forEach((tile, index) => {
        tile.onclick = () => {
          if (isAutoSelectingTiles && !autoGameRunning) {
            if (!selectedAutoTiles.includes(index)) {
              selectedAutoTiles.push(index);
              tile.style.outline = "2px solid yellow";
              startButton.disabled = false;
            } else {
              selectedAutoTiles = selectedAutoTiles.filter((i) => i !== index);
              tile.style.outline = "";
            }
          }
        };
      });

      autoGameActive = true;
      randombtn.disabled = true;
      disabledbtn();
    } else {
      // 🔹 Deactivate Auto Game mode
      isAutoSelectingTiles = false;
      autoGameRunning = false;
      betButton.disabled = false;
      autoGameBtn.style.backgroundColor = ""; // reset to default
      autoGameActive = false;
      randombtn.disabled = false;
      betButton.style.display = "block";
      startButton.style.display = "none";
      Enabledbtn();
      tiles.forEach((tile) => (tile.style.outline = "")); // clear highlights
      resetGame();
      showToast("Auto Game deactivated.");
    }
    playSoundEffect("sound/buttonclick.wav");
  });
  // 🔹 Activate random auto mode
  randombtn.addEventListener("click", () => {
    if (!randomModeActive) {
      // 🔹 Activate
      useRandomTiles = true;
      randomAutoMode = true;
      selectedAutoTiles = [];
      randombtn.style.backgroundColor = "green";
      betButton.style.display = "none";
      startButton.style.display = "block";
      resetGame();
      showToast("Random mode activated. Click BET to start Auto Game.");
      randomModeActive = true;
      autoGameBtn.disabled = true;
      disabledbtn();
    } else {
      // 🔹 Deactivate
      useRandomTiles = false;
      randomAutoMode = false;
      betButton.style.display = "block";
      startButton.style.display = "none";
      randombtn.style.backgroundColor = ""; // reset to default
      resetGame();
      showToast("Random mode deactivated.");
      randomModeActive = false;
      autoGameBtn.disabled = false;
      Enabledbtn();
    }
    playSoundEffect("sound/buttonclick.wav");
  });

  // 🔹 Tile click handler (for selection in auto mode)

  // 🔹 Toggle auto game mode
  function proceedToNextAutoRound() {
    if (!autoGameRunning) return;

    clearTimeout(autoTimeout); // always clear old

    autoTimeout = setTimeout(() => {
      resetGame();
      currentBet = parseInt(betInput.value);
      if (balance >= currentBet) {
        balance -= currentBet;
        updateBalance();

        if (randomAutoMode) {
          selectedAutoTiles = [];
          while (selectedAutoTiles.length < 5) {
            const randIndex = Math.floor(Math.random() * totalTiles);
            if (!selectedAutoTiles.includes(randIndex)) {
              selectedAutoTiles.push(randIndex);
            }
          }
        }

        flipAutoTiles();
      } else {
        autoGameRunning = false;
        showToast("Not enough balance to continue auto play.");
      }
    }, 1500);
  }

  // 🔹 Main bet button logic (starts game or cash out)
  betButton.addEventListener("click", () => {
    const bet = parseInt(betInput.value);
    if (!bet || bet < 10) {
      showToast("Minimum bet is ₹10");
      return;
    }
    if (bet > balance) {
      showToast("Not enough balance 💸");
      return;
    }

    currentBet = bet;

    // ...existing code...
    if (!gameStarted && isAutoSelectingTiles && selectedAutoTiles.length > 0) {
      isAutoSelectingTiles = false;
      autoGameRunning = true; // <-- THIS LINE IS IMPORTANT
      randomAutoMode = false;
      useRandomTiles = false;

      balance -= currentBet;
      updateBalance();
      gameStarted = true;
      betButton.innerText = "CASH OUT";

      flipAutoTiles();
      selectedAutoTiles.forEach((index) => {
        tiles[index].style.outline = "2px solid yellow";
      });
      // ...existing code...
    } else if (!gameStarted && randomAutoMode) {
      autoGameRunning = true;
      isAutoSelectingTiles = false;
      useRandomTiles = false;
      balance -= currentBet;
      updateBalance();
      gameStarted = true;
      betButton.innerText = "CASH OUT";

      selectedAutoTiles = [];
      while (selectedAutoTiles.length < 5) {
        const randIndex = Math.floor(Math.random() * totalTiles);
        if (!selectedAutoTiles.includes(randIndex)) {
          selectedAutoTiles.push(randIndex);
        }
      }

      flipAutoTiles();
    } else if (!gameStarted) {
      balance -= currentBet;
      updateBalance();
      startManualGame();
    } else {
      autoGameRunning = false;
      cashOut();
    }
  });

  // 🔹 Handle bet amount increase/decrease
  betPlusBtn.addEventListener("click", () => {
    let currentValue = parseInt(betInput.value) || 0;
    betInput.value = currentValue + 10; // Increase by 10
    playSoundEffect("sound/buttonclick.wav");
  });

  betMinusBtn.addEventListener("click", () => {
    let currentValue = parseInt(betInput.value) || 0;
    if (currentValue > 10) {
      betInput.value = currentValue - 10; // Decrease by 10
    }
    playSoundEffect("sound/buttonclick.wav");
  });
  minBtn.addEventListener("click", () => {
    betInput.value = 10;
    playSoundEffect("sound/buttonclick.wav");
  });

  // Set maximum value = 100
  maxBtn.addEventListener("click", () => {
    betInput.value = 100;
    playSoundEffect("sound/buttonclick.wav");
  });

  // 🔹 Show how to play popup
  howToPlayBtn.addEventListener("click", () => {
    howToPlayPopup.style.display = "flex";
  });

  closeHowToPlay.addEventListener("click", () => {
    howToPlayPopup.style.display = "none";
  });
  howplay.addEventListener("click", () => {
    howToPlayPopup.style.display = "flex";
  });

  // Optional: close on outside click
  window.addEventListener("click", (e) => {
    if (e.target === howToPlayPopup) {
      howToPlayPopup.style.display = "none";
    }
  });
  // 🔹 Start manual (click-based) game
  function startManualGame() {
    safeClicks = 0;
    mineIndexes = [];
    winAmount = 0;
    gameOverPopup.style.display = "none";
    winPopup.style.display = "none";
    betButton.style.display = "none";
    stopButton.style.display = "none";
    cashButton.style.display = "block";
    cashButton.disabled = true;
    generateMines();

    tiles.forEach((tile, index) => {
      tile.classList.remove("flipped");
      tile.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
      tile.style.backgroundColor = "";
      tile.onclick = () => {
        if (!gameStarted || tile.classList.contains("flipped")) return;
        tile.classList.add("flipped");

        if (mineIndexes.includes(index)) {
          tile.innerHTML =
            '<i class="fa fa-circle" aria-hidden="true" style="visibility:hidden;"></i>';
          tile.style.backgroundImage = "url('mineimg/Fire.webp')";
          tile.style.backgroundSize = "contain";
          tile.style.backgroundRepeat = "no-repeat";
          tile.style.backgroundPosition = "center";
          tile.style.backgroundColor = "#fa7273";
          playSoundEffect("sound/bomb.777c9d64.mp3");

          gameOver();

          // ✅ Fix: Only reset manually played games
          if (!autoGameRunning && !randomAutoMode) {
            setTimeout(() => {
              gameOverPopup.style.display = "none";
              resetGame();
              betButton.innerText = "BET";
            }, 2000);
          }
        } else {
          playSoundEffect("sound/diamond3.68da1013.mp3");
          tile.innerHTML =
            '<i class="fa fa-circle" aria-hidden="true" style="visibility:hidden;"></i>';
          tile.style.backgroundImage = "url('mineimg/Star.webp')";
          tile.style.backgroundSize = "contain";
          tile.style.backgroundRepeat = "no-repeat";
          tile.style.backgroundPosition = "center";
          tile.style.backgroundColor = "#f8b419";
          safeClicks++;
          updateLiveWin();
          checkWinCondition();
        }
      };
    });

    gameStarted = true;
    betButton.innerHTML = `CASH OUT <span class="live-win">(₹0)</span>`;
  }

  // 🔹 Initial UI setup
  updateBalance();
  updateMineBtnText();
  updateMultiplierText();
};
function toggleNavbarMenu() {
  const menu = document.getElementById("navbar-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Optional: Close when clicking outside
window.addEventListener("click", function (event) {
  const menu = document.getElementById("navbar-menu");
  const button = document.querySelector(".menubtn");

  if (!menu.contains(event.target) && !button.contains(event.target)) {
    menu.style.display = "none";
  }
});
