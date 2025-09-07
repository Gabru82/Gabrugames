window.addEventListener("load", function () {
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
  preloadImages(() => {}); // Preload only
  // Hide loading screen
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
  }, 2000);
});

const chicken = document.getElementById("chicken");

const bur = document.getElementById("burnchicken");
const playBtn = document.getElementById("playBtn");
const gameArea = document.getElementById("gameArea");
const betInput = document.getElementById("betInput");
const betvalue = document.getElementById("betbox2");
//const goNextBtn = document.getElementById("goNextBtn");
const cashoutBtn = document.getElementById("cashoutBtn");
const cashOutPopup = document.getElementById("cashOutPopup");
const winAmountSpan = document.getElementById("winAmount");

let tiles = document.querySelectorAll(".chickenhome1");
let blocks = tiles.length;
let allBoxes = document.querySelectorAll(".chickenhome1");
let walletAmount = 5000;
const walletBtn = document.getElementById("walletBtn");
walletBtn.textContent = walletAmount; // Initial wallet display
const Menubtn = document.getElementById("menubtn");
const howBtn = document.getElementById("howbtn");
const howBtn2 = document.getElementById("howbtn2");
const popup = document.getElementById("rulesPopup");
const closeBtn = document.getElementById("closePopup");
const menuBtn = document.getElementById("menubtn");
const popupMenu = document.getElementById("popupMenu");
const glowEl = document.getElementById("spanp");
const betButton = document.querySelectorAll(".numb");
const modeButton = document.querySelectorAll(".chnmod");
const MIN = document.getElementById("Min");
const MAX = document.getElementById("Max");
const easyBtn = document.getElementById("easybtn");
const mediumBtn = document.getElementById("mediumbtn");
const hardBtn = document.getElementById("hardbtn");
const hardcoreBtn = document.getElementById("hardcorebtn");
const modedropdown = document.getElementById("modeDropdown");
const animationElement = document.getElementById("animation");

let prevBox = null;
let isGameOver = false;
let currentStep = 0;
let currentPosition = 50;
let gameOver = false;
let fireStarted = false;
const MIN_AMOUNT = 10;
let MAX_AMOUNT = 5000;
let fireInterval = null;
let betDeducted = false;
let originalProfitValues = [];
let currentProfit = 0;
let betAmount = 0;

const profitMultipliersEasy = [
  1.03, 1.15, 1.3, 1.47, 1.65, 1.85, 2.07, 2.31, 2.57, 2.85, 3.15, 3.47, 3.81,
  4.17, 4.55, 4.95, 5.37, 5.81, 19.2,
];
const profitMultipliersMedium = [
  1.12, 1.28, 1.47, 1.7, 1.98, 2.33, 2.76, 3.32, 4.03, 4.96, 6.2, 6.91, 8.9,
  11.74, 15.99, 22.61, 33.58, 53.2, 1788.8,
];
const profitMultipliersHard = [
  1.23, 1.55, 1.98, 2.56, 3.36, 4.49, 5.49, 7.53, 10.56, 15.21, 22.59, 34.79,
  55.97, 94.99, 172.42, 341.4, 760.46, 2007.63, 6956.47, 41321.43,
];
const profitMultipliersHardcore = [
  1.63, 2.8, 4.95, 9.08, 15.21, 30.12, 62.96, 140.24, 337.19, 890.19, 2643.89,
  9161.08, 39301.05, 233448.29, 2542251.93,
];
let selectedMode = "easy"; // default
let profitMultipliers = profitMultipliersEasy; // default multipliers

const modeBoxCounts = {
  easy: 19,
  medium: 19,
  hard: 20,
  hardcore: 15,
};

// ✅ Easy mode: only selectable if not already active
document.getElementById("easybtn").addEventListener("click", () => {
  if (selectedMode === "easy") return; // prevent reselecting
  selectedMode = "easy";
  profitMultipliers = profitMultipliersEasy;
  generateBoxes(modeBoxCounts.easy);

  highlightMode("easybtn");

  resetGame();
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
});

document.getElementById("mediumbtn").addEventListener("click", () => {
  if (selectedMode === "medium") return;
  selectedMode = "medium";
  profitMultipliers = profitMultipliersMedium;
  generateBoxes(modeBoxCounts.medium);

  highlightMode("mediumbtn");

  resetGame();
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
});

document.getElementById("hardbtn").addEventListener("click", () => {
  if (selectedMode === "hard") return;
  selectedMode = "hard";
  profitMultipliers = profitMultipliersHard;
  generateBoxes(modeBoxCounts.hard);

  highlightMode("hardbtn");

  resetGame();
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
});

document.getElementById("hardcorebtn").addEventListener("click", () => {
  if (selectedMode === "hardcore") return;
  selectedMode = "hardcore";
  profitMultipliers = profitMultipliersHardcore;
  generateBoxes(modeBoxCounts.hardcore);

  highlightMode("hardcorebtn");

  resetGame();
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
});

modedropdown.addEventListener("change", function () {
  const value = this.value;
  if (value === "easy") {
    document.getElementById("easybtn").click();
  } else if (value === "medium") {
    document.getElementById("mediumbtn").click();
  } else if (value === "hard") {
    document.getElementById("hardbtn").click();
  } else if (value === "hardcore") {
    document.getElementById("hardcorebtn").click();
  }
});

function highlightMode(activeId) {
  document.querySelectorAll(".chnmod").forEach((btn) => {
    btn.style.backgroundColor = "#4e5062";
    btn.style.color = "white";
  });

  const activeBtn = document.getElementById(activeId);
  activeBtn.style.backgroundColor = "#898888";
  activeBtn.style.color = "white";
}

// ✅ Highlight Easy mode at the start
highlightMode("easybtn");

const image1 = "/chickenimg/Wall1.webp"; // First image
const image2 = "/chickenimg/Wall22.webp"; // Second image

function generateBoxes(count) {
  const gameArea = document.getElementById("gameArea");

  // Remove old boxes
  const allChildren = Array.from(gameArea.children);
  allChildren.forEach((child) => {
    if (child.classList.contains("chickenhome1")) {
      gameArea.removeChild(child);
    }
  });

  // Generate new boxes
  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.classList.add("chickenhome1");

    // If this is the LAST box → make it the WIN box
    if (i === count - 1) {
      box.classList.add("win"); // so collision check works
      box.id = "Win";

      const img = document.createElement("img");
      img.src = "/chickenimg/winbox_magic1.webp";
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      box.appendChild(img);

      const btn = document.createElement("button");
      btn.classList.add("eggshow");
      btn.id = `box-${i + 1}`;
      btn.textContent = profitMultipliers[i] ? profitMultipliers[i] : "WIN";
      box.appendChild(btn);

      winBox = box; // ✅ update global winBox
    } else {
      // Normal box
      const img = document.createElement("img");
      img.src = i % 2 === 0 ? image1 : image2;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      box.appendChild(img);

      const btn = document.createElement("button");
      btn.classList.add("profitshow");
      btn.id = `box-${i + 1}`;
      btn.textContent = profitMultipliers[i];
      box.appendChild(btn);
      // ✨ Add glow class
      // 🔥 Add glow span
      const glowSpan = document.createElement("span");
      glowSpan.id = `glow-${i + 1}`;
      glowSpan.classList.add("spanp");
      box.appendChild(glowSpan);
    }

    gameArea.appendChild(box);
  }

  // ✅ Add the END normal win box
  const endBox = document.createElement("div");
  endBox.classList.add("chickenhome1", "winbox");
  const endImg = document.createElement("img");
  endImg.src = "/chickenimg/winbox.webp";
  endImg.alt = "";
  endImg.style.width = "100%";
  endImg.style.height = "100%";

  endBox.appendChild(endImg);
  gameArea.appendChild(endBox);

  // Update references
  tiles = document.querySelectorAll(".chickenhome1");
  blocks = tiles.length;
  allBoxes = document.querySelectorAll(".chickenhome1");
}

function showSafeGlow() {
  const glowEl = document.getElementById("spanp");
  if (!glowEl) {
    console.warn("Glow element not found");
    return;
  }

  glowEl.classList.remove("spanp");
  void glowEl.offsetWidth;

  setTimeout(() => {
    glowEl.classList.add("spanp");
  }, 50);
}
// 🔥 Chance of fire on tile (0.3 = 30%)
const FIRE_CHANCE = 0.3;
// Pehle sirf playBtn dikhaye
playBtn.style.display = "inline-block";
playBtn.style.width = "100%";
cashoutBtn.style.display = "none";

const rulesPopup = document.getElementById("rulesPopup");
const closePopup = document.getElementById("closePopup");

// Show popup
// Show popup from either button
[howBtn, howBtn2].forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", () => {
      rulesPopup.style.display = "flex"; // or "block"
    });
  }
});

// Hide popup when clicking close button
closePopup.addEventListener("click", () => {
  rulesPopup.style.display = "none";
});

// Hide popup when clicking outside content
window.addEventListener("click", (event) => {
  if (event.target === rulesPopup) {
    rulesPopup.style.display = "none";
  }
});

const menuPopup = document.getElementById("menuPopup");

menuBtn.addEventListener("click", () => {
  menuPopup.style.display =
    menuPopup.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (e) => {
  if (!menuBtn.contains(e.target) && !menuPopup.contains(e.target)) {
    menuPopup.style.display = "none";
  }
});

function showToast(message) {
  const toast = document.getElementById("toast-notification");
  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2500); // 2.5 seconds
}

function buttonoff() {
  betInput.disabled = true;
  playBtn.disabled = true; // GO button disable karo
  cashoutBtn.disabled = true;
  MIN.disabled = true;
  MAX.disabled = true;
  modedropdown.disabled = true;
  betButton.forEach((btn) => (btn.disabled = true));
  modeButton.forEach((btn) => (btn.disabled = true));
}
function buttonon() {
  MAX.disabled = false;
  MIN.disabled = false;
  modedropdown.disabled = false;
  betInput.disabled = false;
  betButton.forEach((btn) => (btn.disabled = false));
  modeButton.forEach((btn) => (btn.disabled = false));
}

let winBox = null; // global

let hasCelebrated = false;

function checkWinCollision() {
  const winBox = document.getElementById("Win"); // ✅ fetch latest win box every time
  if (!winBox || hasCelebrated) return;

  const chickenRect = chicken.getBoundingClientRect();
  const winRect = winBox.getBoundingClientRect();

  const isInside =
    chickenRect.left < winRect.right &&
    chickenRect.right > winRect.left &&
    chickenRect.top < winRect.bottom &&
    chickenRect.bottom > winRect.top;

  if (isInside) {
    chicken.src = "/chickenimg/Chicken_Walk 2.gif"; // change gif
    hasCelebrated = true;

    buttonon();

    const profit = parseFloat(currentProfit.toFixed(2));

    // make sure it's a number

    walletAmount += profit; // ✅ Add profit only once
    updateWalletUI();

    // ✅ Show win amount
    winAmountSpan.textContent = profit;
    cashOutPopup.style.display = "flex";

    // ✅ Remove background image from all buttons on cash out
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bg");
    });
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bgg");
    });
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bggg");
    });

    setTimeout(() => {
      cashOutPopup.style.display = "none";
    }, 3000);
    playBtn.style.display = "flex";
    playBtn.style.width = "100%";
    cashoutBtn.style.display = "none";

    chicken.style.animation = "none";
    chicken.style.transform = "left";
    chicken.style.left = "200px";

    setTimeout(() => {
      chicken.src = celebrationGif2;
      resetGame();
    }, 5000);
  }
}

// Run check while chicken is moving
setInterval(checkWinCollision, 50);

const totalFrames = 10;
const images = [];
let currentFrame = 0;
let animationInterval;

// Preload all images
function preloadImages(callback) {
  let loadedCount = 0;

  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    img.src = `/frame2/frame${i}.png`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalFrames) {
        callback(); // All images loaded
      }
    };
    images.push(img);
  }
}

// Start animation on button click
function startAnimation() {
  chicken.style.visibility = "hidden"; // Hide GIF
  animationElement.style.visibility = "visible"; // Show frames

  currentFrame = 0;
  animationInterval = setInterval(() => {
    animationElement.src = images[currentFrame].src;
    currentFrame++;

    if (currentFrame >= totalFrames) {
      clearInterval(animationInterval);
      animationElement.style.visibility = "hidden";
      chicken.style.visibility = "visible"; // Optional: show GIF again         // 🧠 Your movement logic here
    }
  }, 35); // 100ms per frame
}

function checkWinCollision() {
  const winBox = document.getElementById("Win"); // ✅ fetch latest win box every time
  if (!winBox || hasCelebrated) return;

  const chickenRect = chicken.getBoundingClientRect();
  const winRect = winBox.getBoundingClientRect();

  const isInside =
    chickenRect.left < winRect.right &&
    chickenRect.right > winRect.left &&
    chickenRect.top < winRect.bottom &&
    chickenRect.bottom > winRect.top;

  if (isInside) {
    chicken.src = "/chickenimg/Chicken_Walk 2.gif"; // change gif
    hasCelebrated = true;

    buttonon();

    const profit = parseFloat(currentProfit.toFixed(2));

    // make sure it's a number

    walletAmount += profit; // ✅ Add profit only once
    updateWalletUI();

    // ✅ Show win amount
    winAmountSpan.textContent = profit;
    cashOutPopup.style.display = "flex";

    // ✅ Remove background image from all buttons on cash out
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bg");
    });
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bgg");
    });
    document.querySelectorAll(".profitshow").forEach((btn) => {
      btn.classList.remove("safe-button-bggg");
    });

    setTimeout(() => {
      cashOutPopup.style.display = "none";
    }, 3000);

    cashoutBtn.textContent = `Cashout ₹0`;
    playBtn.style.display = "flex";
    chicken.style.animation = "none";
    chicken.style.transition = "transform 5s linear";
    chicken.style.transform = "translateX(150vw)";
     chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames

    setTimeout(() => {
      resetGame();
    }, 5000);
  }
}
// Run check while chicken is moving
setInterval(checkWinCollision, 50);
// 🟡 Play button -> only handles betting + UI, then calls chicken move
playBtn.addEventListener("click", () => {
  buttonoff();
  hasCelebrated = false;

  setTimeout(() => startAnimation(), 300);

  setTimeout(() => {
    cashoutBtn.disabled = false;
    playBtn.disabled = false;
  }, 1500);

  if (!fireStarted) {
    startRandomFire();
    fireStarted = true;
  }

  const value = parseInt(betInput.value);
  if (gameOver) return;

  if (!betDeducted) {
    if (isNaN(value) || value < MIN_AMOUNT) {
      buttonon();
      showToast(`Please enter amount ₹${MIN_AMOUNT}`);
      animationElement.style.display = "none";
      chicken.style.display = "block";
      return;
    }

    if (value > walletAmount) {
      buttonon();
      showToast("❌ Insufficient balance to place this bet.");
      chicken.style.visibility = "visibile"; // Hide GIF
      animationElement.style.visibility = "hidden"; // Show frames

      return;
    }

    if (value > MAX_AMOUNT) {
      buttonon();
      showToast(`Maximum allowed amount is ₹${MAX_AMOUNT}`);
      chicken.style.visibility = "visible"; // Hide GIF
      animationElement.style.visibility = "hidden"; // Show frames

      return;
    }

    // ✅ Deduct only once
    walletAmount -= value;
    updateWalletUI();
    betDeducted = true;
  }

  betAmount = parseInt(betInput.value);

  // Buttons toggle karo
  cashoutBtn.style.display = "flex";
  cashoutBtn.style.backgroundColor = "yellow";
  cashoutBtn.style.color = "black";
  playBtn.style.width = "40%";

  // 🐔 Actual chicken move is here
  moveChickenForward();
});

// 🟡 Single function for chicken forward movement
function moveChickenForward() {
  if (isGameOver || gameOver) return;
  currentStep++;
  if (currentStep >= blocks) return;

  currentPosition += 200;

  chicken.style.transition = "all 0.3s ease-in-out";
  animationElement.style.transition = "all 0.3s ease-in-out";
  bur.style.transition = "all 0.3s ease-in-out";
  bur.style.transform = "translateY(-30px)";

  setTimeout(() => {
    chicken.style.left = `${currentPosition}px`;
    animationElement.style.left = `${currentPosition}px`;
    bur.style.left = `${currentPosition}px`;
    bur.style.transform = `translateY(0px)`;

    gameArea.scrollTo({
      left: currentStep * 200 - 100,
      behavior: "smooth",
    });

    const currentTile = tiles[currentStep - 1]; // ← chicken position
    window.chickenTile = currentTile;
    handleChickenMove(currentStep - 1);

    // ✅ Profit calculation
    const multiplier = profitMultipliers[currentStep - 1];
    if (multiplier) {
      currentProfit = betAmount * multiplier;
      cashoutBtn.textContent = `Cashout ₹${Math.floor(currentProfit)}`;
    } else {
      currentProfit = 0;
      cashoutBtn.textContent = `Cashout ₹0`;
    }

    // Show floating profit
    const winText = document.createElement("div");
    winText.classList.add("win-text");
    winText.textContent = `₹${Math.floor(currentProfit)}`;
    currentTile.appendChild(winText);

    setTimeout(() => {
      if (winText.parentNode) winText.remove();
    }, 1000);

    // 🔥 Fire chance
    const random = Math.random();
    if (random < FIRE_CHANCE) {
      const fireDiv = document.createElement("div");
      fireDiv.classList.add("redfire");
      currentTile.appendChild(fireDiv);

      setTimeout(() => {
        playBtn.style.display = "none";
        cashoutBtn.style.display = "none";
      }, 0);

      setTimeout(() => {
        bur.style.display = "block";
        chicken.style.visibility = "hidden"; // Hide GIF
        animationElement.style.visibility = "hidden"; // Show frames
      }, 500);

      gameOver = true;

      const profitBtn = currentTile.querySelector(".profitshow");
      if (profitBtn) {
        if (!originalProfitValues[0]) {
          originalProfitValues[0] = profitBtn.textContent;
        }
        profitBtn.classList.add("flip", "safe-button-bgg");
        profitBtn.textContent = "";
        profitBtn.addEventListener(
          "animationend",
          () => {
            profitBtn.classList.remove("flip");
          },
          { once: true }
        );
      }

      setTimeout(() => {
        showToast("🔥 Game Over! Chicken got burnt!");
        if (profitBtn && profitBtn.textContent === "") {
          profitBtn.textContent = originalProfitValues[0] || "NEXT: 1.5x";
          profitBtn.classList.remove("flip", "safe-button-bgg");
        }
        resetGame();
      }, 2000);
    } else {
      // ✅ Safe move
      document.querySelectorAll(".spanp").forEach((p) => {
        p.classList.remove("glow-animate");
        p.style.display = "none";
      });

      const glowDiv = currentTile.querySelector(".spanp");
      if (glowDiv) {
        glowDiv.style.display = "block";
        void glowDiv.offsetWidth;
        glowDiv.classList.add("glow-animate");
      }

      const profitBtn = currentTile.querySelector(".profitshow");
      if (profitBtn) {
        profitBtn.classList.add("flip", "safe-button-bg");
        profitBtn.addEventListener(
          "animationend",
          () => {
            profitBtn.classList.remove("flip");
          },
          { once: true }
        );
      }
    }
  }, 500);
}

// wallet update logic
function updateWalletUI() {
  walletAmount = parseFloat(walletAmount.toFixed(2));
  document.getElementById("walletBtn").textContent = walletAmount.toFixed(2);
}

// 🟡 Input min-max control (typing)
betInput.addEventListener("input", () => {
  let value = parseInt(betInput.value);

  // Get wallet from session (or variable)
  const user = JSON.parse(sessionStorage.getItem("user"));
  const maxAllowed = user?.wallet || 0;

  if (value > maxAllowed) {
    betInput.value = maxAllowed;
  } else if (value < 0) {
    betInput.value = 0;
  }
});

function handleChickenMove(currentIndex) {
  const previousIndex = currentIndex - 1;
  if (previousIndex < 0) return;

  const previousTile = tiles[previousIndex];
  if (!previousTile) return;

  const prevBtn = previousTile.querySelector(".profitshow");
  if (prevBtn) {
    // Save original text if not already saved
    if (!originalProfitValues[previousIndex]) {
      originalProfitValues[previousIndex] = prevBtn.textContent;
    }
    prevBtn.classList.add("flip", "safe-button-bggg");
    prevBtn.textContent = ""; // hide text
  }
}

// Game over function me yeh add karo
function showProfitValuesBack() {
  tiles.forEach((tile, index) => {
    const profitEl = tile.querySelector(".profitshow");
    if (profitEl && originalProfitValues[index]) {
      profitEl.textContent = originalProfitValues[index]; // wapas original text
    }
  });
  // Clear array for next round
  originalProfitValues = [];
}

cashoutBtn.addEventListener("click", () => {
  buttonon();

  const profit = parseFloat(currentProfit.toFixed(2));

  // make sure it's a number

  walletAmount += profit; // ✅ Add profit only once
  updateWalletUI();

  // ✅ Show win amount
  winAmountSpan.textContent = profit;
  cashOutPopup.style.display = "flex";

  // ✅ Remove background image from all buttons on cash out
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bg");
  });
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bgg");
  });
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bggg");
  });

  setTimeout(() => {
    cashOutPopup.style.display = "none";
  }, 3000);

  resetGame();
  cashoutBtn.textContent = ` Cashout ₹0`;
  playBtn.style.display = "flex";
  cashoutBtn.style.display = "none";
  chicken.style.visibility = "visible"; // Hide GIF
  animationElement.style.visibility = "hidden"; // Show frames
});

function burnChicken() {
  isGameOver = true;
  clearInterval(fireInterval);
  fireStarted = false;

  allBoxes.forEach((box) => {
    const glow = box.querySelector("p.spanp");
    if (glow) {
      glow.remove(); // remove p tag completely
    }
  });

  setTimeout(() => {
    resetGame();
  }, 1000);
}

function resetGame() {
  buttonon();
  hasCelebrated = false; // ✅ allow win detection again
  cashoutBtn.textContent = ` Cashout ₹0`;
  chicken.src ="/chickenimg/Chicken Ideal Animation.gif"; // change gif

  // 1. Remove fire from chicken
  const fire = chicken.querySelector(".fire");
  if (fire) fire.remove();

  // 2. Remove fire from all tiles
  tiles.forEach((tile) => {
    const fireDiv = tile.querySelector(".fire");
    if (fireDiv) fireDiv.remove();
  });
  // 1. Remove fire from chicken
  const redfire = chicken.querySelector(".redfire");
  if (redfire) redfire.remove();

  // 2. Remove fire from all tiles
  tiles.forEach((tile) => {
    const redfireDiv = tile.querySelector(".redfire");
    if (redfireDiv) redfireDiv.remove();
  });

  // ✅ Remove background image from all buttons on cash out
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bg");
  });
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bgg");
  });
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("safe-button-bggg");
  });

  // ✅ Remove flip class as well (so flip can re-trigger)
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.classList.remove("flip");
  });

  // Reset bet deduction for next round
  betDeducted = false;

  // 3. Remove burn effect
  chicken.classList.remove("burn", "burned");

  document.querySelectorAll(".spanp").forEach((p) => {
    p.classList.remove("glow-animate");
    p.style.display = "none";
  });

  // 4. Reset position & variables
  currentStep = 0;
  currentPosition = 40;
  chicken.style.left = `${currentPosition}px`;
  chicken.style.transition = "none"; // Instant reset
  chicken.style.transform = "translateY(0px)";
  animationElement.style.left = `${currentPosition}px`;
  animationElement.style.transition = "none"; // Instant reset
  animationElement.style.transform = "translateY(0px)";

  // 5. Scroll gameArea to start
  gameArea.scrollTo({
    left: 0,
    behavior: "smooth",
  });


  playBtn.style.display = "flex";
  playBtn.style.width = "100%";
  cashoutBtn.style.display = "none";
  bur.style.display = "none";

  // 6. Clear game states
  isGameOver = false;
  gameOver = false;
  clearInterval(fireInterval);
  fireStarted = false;
    chicken.style.visibility = "visible"; // Hide GIF
  animationElement.style.visibility = "hidden"; // Show frames
 

  showProfitValuesBack();

  // document.querySelectorAll('.dead-chicken').forEach(img => img.remove());
}

function gameOverSequence() {
  gameOver = true;
  isGameOver = true;
  updateWalletUI();

  // Burn animation class
  chicken.classList.add("burn");

  document.querySelectorAll(".spanp").forEach((p) => {
    p.classList.remove("glow-animate");
    p.style.display = "none"; // hide glow
  });

  // Wait 1.5 seconds then restart the game
  setTimeout(() => {
    resetGame();
  }, 2000);
}

function startRandomFire() {
  clearInterval(fireInterval);
  fireInterval = setInterval(() => {
    // Remove all random fires
    document.querySelectorAll(".fire.random").forEach((fire) => fire.remove());

    // Get all safe tiles (where chicken isn't AND not the endbox)
    const safeTiles = Array.from(tiles).filter(
      (tile) =>
        tile !== window.chickenTile && !tile.classList.contains("winbox")
    );

    // Shuffle safeTiles for randomness
    for (let i = safeTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [safeTiles[i], safeTiles[j]] = [safeTiles[j], safeTiles[i]];
    }

    // Place fire in up to 3 different random safe tiles (ya jitne available hain)
    for (let i = 0; i < Math.min(3, safeTiles.length); i++) {
      const tile = safeTiles[i];
      if (!tile.querySelector(".fire")) {
        const fire = document.createElement("div");
        fire.classList.add("fire", "random");
        tile.appendChild(fire);
      }
    }

    // ✅ NEW CHECK: chicken ke current tile par fire to nahi?
    if (window.chickenTile && window.chickenTile.querySelector(".fire")) {
      chicken.classList.add("burned");

      gameOver = true;
      setTimeout(() => {
        resetGame();
      }, 1000);
    }
  }, 1000);
}

// Start movement
// setInterval(moveChickenForward, 1000);

// 🟡 Buttons
document.querySelector(".min").addEventListener("click", () => {
  betInput.value = MIN_AMOUNT;
});

document.querySelector(".max").addEventListener("click", () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const walletBalance = user?.wallet || 0;
  betInput.value = walletBalance;
  betInput.dispatchEvent(new Event("input"));
});

document.querySelectorAll(".numb").forEach((btn) => {
  btn.addEventListener("click", () => {
    let newValue = parseInt(btn.getAttribute("data-value"));
    if (newValue >= MIN_AMOUNT && newValue <= MAX_AMOUNT) {
      betInput.value = newValue;
    } else {
      showToast(`Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}`);
    }
  });
});
