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
      balance += winAmount;
      updateBalance();
      winAmount = 0;
    }

    // Show all mine tiles
    tiles.forEach((tile, index) => {
      if (mineIndexes.includes(index)) {
        tile.classList.add("flipped");
        tile.innerHTML = "💣";
        tile.style.backgroundColor = "#ff4d4d";
      }
      tile.onclick = null;
    });

    gameOverMsg.innerText = "💥 GAME OVER 💥";
    gameOverPopup.style.display = "flex";
    betButton.textContent = "BET";

    // 🔁 Auto continue if auto game is active
    setTimeout(() => {
      gameOverPopup.style.display = "none";

      if (autoGameRunning) {
        proceedToNextAutoRound();
        clearTimeout(autoTimeout); // prevent stacking timeouts

        autoTimeout = setTimeout(() => {
          resetGame();
          currentBet = parseInt(betInput.value);

          if (balance >= currentBet) {
            balance -= currentBet;
            updateBalance();

            // Set button to show cash out and reset win amount display
            betButton.textContent = `CASH OUT ₹0`;

            if (randomAutoMode) {
              selectedAutoTiles = [];
              while (selectedAutoTiles.length < 5) {
                const randIndex = Math.floor(Math.random() * tiles.length);
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
        }, 500); // Slight delay to restart game
      }
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
    gameStarted = false;
    mineIndexes = [];
    safeClicks = 0;
    winAmount = 0;
    useRandomTiles = false;

    tiles.forEach((tile) => {
      tile.classList.remove("flipped");
      tile.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
      tile.style.backgroundColor = "";
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
  // ...existing code...

  // 🔹 Manual tile selection for auto game
  autoGameBtn.addEventListener("click", () => {
    // Reset all states
    selectedAutoTiles = [];
    isAutoSelectingTiles = true;
    autoGameRunning = false;
    randomAutoMode = false;
    useRandomTiles = false;
    resetGame();

    showToast("Select tiles for Auto Game. Then click BET.");

    // Enable tile selection only in auto mode
    tiles.forEach((tile, index) => {
      tile.onclick = () => {
        if (isAutoSelectingTiles && !autoGameRunning) {
          if (!selectedAutoTiles.includes(index)) {
            selectedAutoTiles.push(index);
            tile.style.outline = "2px solid yellow";
          } else {
            selectedAutoTiles = selectedAutoTiles.filter((i) => i !== index);
            tile.style.outline = "";
          }
        }
      };
    });
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
    generateMines();

    tiles.forEach((tile, index) => {
      tile.classList.remove("flipped");
      tile.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
      tile.style.backgroundColor = "";
      tile.onclick = () => {
        if (!gameStarted || tile.classList.contains("flipped")) return;
        tile.classList.add("flipped");

        if (mineIndexes.includes(index)) {
          tile.innerHTML = "💣";
          tile.style.backgroundColor = "#ff4d4d";
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
          tile.innerHTML = "⭐";
          tile.style.backgroundColor = "#00cc99";
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
