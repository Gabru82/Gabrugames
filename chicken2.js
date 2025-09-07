// JavaScript
window.addEventListener("load", function () {
  // Hide loading screen
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
  }, 2000);
});

const playBtn = document.getElementById("playBtn");
const cashoutBtn = document.getElementById("cashoutBtn");
const restartBtn = document.getElementById("restartBtn");
const chicken = document.getElementById("chicken");
const deadchicken = document.getElementById("deadchicken");
const allBoxes = document.querySelectorAll(".chickenhome1,.winhome");
const gameArea = document.getElementById("gameArea");
const cars = document.querySelectorAll(".car");
const gameOverPopup = document.getElementById("gameOverPopup");
const cashOutPopup = document.getElementById("cashOutPopup");
const winAmountSpan = document.getElementById("winAmount");
const winBox = document.getElementById("winbox");
const modedropdown = document.getElementById("modeDropdown");
const animationElement = document.getElementById("animation");

const walletBtn = document.getElementById("walletBtn");
const betInput = document.getElementById("betInput");
const minBtn = document.getElementById("Min");
const maxBtn = document.getElementById("Max");
const fixedBetBtns = document.querySelectorAll(".numb");
let winAmount = 0; // This should be dynamically set during the game
let totalBalance = parseInt(walletBtn.textContent);

let balance = 5000;
let betAmount = 0;
let hasBetPlaced = false;
let currentStep = 0;
let gameOver = false;
let carIntervals = [];
const carsPerSet = 5;
let currentChickenBox = null;
let nextChickenBox = null; // 🆕 Track the box chicken will move to
let initialChickenX, initialChickenY;

const stoppedCars = new Set(); // Boxes jahan car stop ho chuki ho
const visitedBoxes = new Set();
const manuallyDangerBoxes = new Set(); // Store manually marked danger boxes
const carImages = [
  "/chicken2img/car1.webp",
  "/chicken2img/car2.webp",
  "/chicken2img/car3.webp",
  "/chicken2img/car4.webp",
  "/chicken2img/car5.webp",
  "/chicken2img/car6.webp",
];

const howBtn = document.getElementById("howbtn");
const rulesPopup = document.getElementById("rulesPopup");

howBtn.addEventListener("click", () => {
  rulesPopup.style.display = "flex";
});

rulesPopup.addEventListener("click", () => {
  rulesPopup.style.display = "none";
});

const menuBtn = document.getElementById("menubtn");
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

// Show balance in walletBtn
function updateWalletUI() {
  walletBtn.innerText = `${balance} ₹`;
}
updateWalletUI();

// Min Button
minBtn.addEventListener("click", () => {
  betAmount = 10;
  betInput.value = betAmount;
});

// Max Button
maxBtn.addEventListener("click", () => {
  betAmount = balance;
  betInput.value = betAmount;
});

// Fixed Bet Buttons (e.g., 50, 100, 500)
fixedBetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    betAmount = parseInt(btn.innerText);
    betInput.value = betAmount;
  });
});

// Manual input
betInput.addEventListener("input", () => {
  betAmount = parseInt(betInput.value) || 0;
});

let currentDifficulty = "easy"; // default mode

const modeBoxCounts = {
  easy: 20,
  medium: 19,
  hard: 20,
  hardcore: 19,
};

const difficultySettings = {
  easy: {
    carSpeed: 3000,
    carSpawnRate: 4000,
    multiplierSequence: [
      1.03, 1.15, 1.3, 1.47, 1.65, 1.85, 2.07, 2.31, 2.57, 2.85, 3.15, 3.47,
      3.81, 4.17, 4.55, 4.95, 5.37, 5.81, 6.1,
    ],
  },
  medium: {
    carSpeed: 2000,
    carSpawnRate: 3000,
    multiplierSequence: [
      1.12, 1.28, 1.47, 1.7, 1.98, 2.33, 2.76, 3.32, 4.03, 4.96, 6.2, 6.91, 8.9,
      11.74, 15.99, 22.61, 33.58, 53.2, 1788.8,
    ],
  },
  hard: {
    carSpeed: 1200,
    carSpawnRate: 2000,
    multiplierSequence: [
      1.23, 1.55, 1.98, 2.56, 3.36, 4.49, 5.49, 7.53, 10.56, 15.21, 22.59,
      34.79, 55.97, 94.99, 172.42, 341.4, 760.46, 2007.63, 6956.47, 41321.43,
    ],
  },
  hardcore: {
    carSpeed: 800,
    carSpawnRate: 1300,
    multiplierSequence: [
      1.63, 2.8, 4.95, 7.05, 9.08, 15.21, 22.3, 30.12, 62.96, 90.45, 140.24,
      337.19, 890.19, 2643.89, 9161.08, 2034.04, 39301.05, 233448.29,
      2542251.93,
    ],
  },
};
const difficultyButtons = {
  easy: document.getElementById("easybtn"),
  medium: document.getElementById("mediumbtn"),
  hard: document.getElementById("hardbtn"),
  hardcore: document.getElementById("hardcorebtn"),
};

function setDifficulty(mode) {
  currentDifficulty = mode;

  // Highlight active button
  Object.keys(difficultyButtons).forEach((key) => {
    const btn = difficultyButtons[key];

    // Remove .mode class on selection
    btn.classList.remove("mode");

    if (key === mode) {
      btn.classList.add("active-mode");
    } else {
      btn.classList.remove("active-mode");
    }
  });

  const boxCount = modeBoxCounts[mode];
  const multipliers = difficultySettings[mode].multiplierSequence;

  const allBoxes = document.querySelectorAll(".chickenhome1");

  allBoxes.forEach((box, index) => {
    if (index < boxCount) {
      box.style.display = "block"; // show
      const profitBtn = box.querySelector(".profitshow");
      if (profitBtn) {
        profitBtn.innerText = multipliers[index]
          ? multipliers[index] + "x"
          : "";
      }
    } else {
      box.style.display = "none"; // hide extra boxes
    }
  });

  console.log(`Mode set to: ${mode} | Boxes shown: ${boxCount}`);
  showToast(`Mode: ${mode.toUpperCase()} | Steps: ${boxCount}`);
}

// Hook buttons
difficultyButtons.easy.addEventListener("click", () => setDifficulty("easy"));
difficultyButtons.medium.addEventListener("click", () =>
  setDifficulty("medium")
);
difficultyButtons.hard.addEventListener("click", () => setDifficulty("hard"));
difficultyButtons.hardcore.addEventListener("click", () =>
  setDifficulty("hardcore")
);
setTimeout(() => {
  setDifficulty("easy");
}, 100); // Delay by 100ms

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
function markDangerBoxManually(index) {
  const box = allBoxes[index];
  if (!box) return;

  box.dataset.type = "danger";
  box.classList.add("danger-box");
  manuallyDangerBoxes.add(box);
}

function playSoundEffect(src) {
  const audio = new Audio(src);
  audio.currentTime = 0;
  audio.play().catch((e) => {
    console.warn("Sound play failed:", e);
  });
}
function showBarrierInBox(boxElement) {
  if (boxElement.classList.contains("winfinal")) return; // 🚫 No car on winbox

  const barrier = document.getElementById("Barrier");
  barrier.style.transition = "none"; // Reset any previous transition

  // Set barrier position same as box
  const boxRect = boxElement.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect(); // Fix here // Assuming your main game wrapper
  const left = boxRect.left - gameRect.left;
  const top = boxRect.top - gameRect.top;

  barrier.style.left = `${left}px`;
  barrier.style.top = `-40px`; // Start above box
  barrier.style.display = "block";

  // Force reflow to apply transition
  void barrier.offsetWidth;

  // Animate to inside the box
  barrier.style.transition = "top 0.2s ease-in";
  barrier.style.top = `${top}px`;
}

function spawnCarInChickenBox(boxElement) {
  if (boxElement.classList.contains("winfinal")) return; // 🚫 No barrier on winbox

  const randomCarImage =
    carImages[Math.floor(Math.random() * carImages.length)];
  const car = document.createElement("img");
  car.src = randomCarImage;
  car.className = "spawned-car";

  const carWidth = 130;
  const carHeight = 190;

  const boxLeft = boxElement.offsetLeft;
  const boxTop = boxElement.offsetTop;
  const boxWidth = boxElement.offsetWidth;

  // Center the car inside the box (top center)
  const finalX = boxLeft + (boxWidth - carWidth) / 2;
  const finalY = boxTop - 100; // a little below top edge

  const startY = finalY - 60;

  car.style.position = "absolute";
  car.style.left = `${finalX}px`;
  car.style.top = `${startY}px`;
  car.style.width = `${carWidth}px`;
  car.style.height = ` ${carHeight}px`;
  car.style.zIndex = "5";
  car.style.transition = "top 0.5s ease";

  gameArea.appendChild(car);

  requestAnimationFrame(() => {
    setTimeout(() => {
      car.style.top = `${finalY}px`;
    }, 50);
  });
}
function removeAllSpawnedCars() {
  const cars = document.querySelectorAll(".spawned-car");
  cars.forEach((car) => car.remove());
}
function placeBet() {
  if (hasBetPlaced) return true; // Already placed for this round

  betAmount = parseInt(betInput.value);

  if (isNaN(betAmount) || betAmount < 10) {
    alert("Minimum bet is ₹10");
    modedropdown.disabled = false;
    return false;
  }

  if (betAmount > balance) {
    alert("Insufficient balance");
    modedropdown.disabled = false;
    return false;
  }

  // Deduct once
  balance -= betAmount;
  walletBtn.textContent = balance; // Update your UI
  hasBetPlaced = true;

  return true;
}

cashoutBtn.addEventListener("click", () => {
  balance += winAmount;
  walletBtn.textContent = `${balance} ₹`;
  modedropdown.disabled = false;

  winAmountSpan.textContent = winAmount; // Reset win amount if needed
  hasBetPlaced = false;
  cashoutBtn.style.display = "none";
  cashoutBtn.textContent = "Cash Out";

  // replace with your actual winAmount variable

  // ✅ Show the popup
  cashOutPopup.style.display = "block";

  // ⏱️ Optional: Hide the popup after 3 seconds
  setTimeout(() => {
    cashOutPopup.style.display = "none";
  }, 3000);
  minBtn.disabled = false;
  maxBtn.disabled = false;
  fixedBetBtns.forEach((btn) => (btn.disabled = false));
  document.querySelectorAll(".chnmod").forEach((btn) => (btn.disabled = false));

  restartGame(); // Restart the game
});

window.addEventListener("load", () => {
  chicken.style.visibility = "visible"; // Show GIF
  animationElement.style.visibility = "hidden"; // Hide frames
  preloadImages(() => {}); // Preload only
});

const totalFrames = 10;
const images = [];
let currentFrame = 0;
let animationInterval;

// Preload all images
function preloadImages(callback) {
  let loadedCount = 0;

  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    img.src = `/frame/frame${i}.png`;
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
  }, 40); // 100ms per frame
}

playBtn.addEventListener("click", () => {
  if (gameOver) return;
  if (!placeBet()) return; // ❌ Bet not valid, don't continue
  setTimeout(() => {
    startAnimation();
  }, 300);

  gameOver = false;
  carIntervals.forEach((id) => clearTimeout(id));
  carIntervals = [];
  modedropdown.disabled = true;

  playBtn.disabled = true;
  cashoutBtn.disabled = true;
  playBtn.style.backgroundColor = "green";
  cashoutBtn.style.display = "flex";
  cashoutBtn.style.backgroundColor = "yellow";
  cashoutBtn.style.color = "black";
  minBtn.disabled = true;
  maxBtn.disabled = true;

  fixedBetBtns.forEach((btn) => (btn.disabled = true));
  document.querySelectorAll(".chnmod").forEach((btn) => (btn.disabled = true));
  // Get the correct multiplier sequence for current mode
  const multiplierSequence =
    difficultySettings[currentDifficulty].multiplierSequence;

  setTimeout(() => {
    playBtn.disabled = false;
    cashoutBtn.disabled = false;
    playBtn.style.backgroundColor = "";
  }, 2000);

  if (currentStep >= allBoxes.length) return;

  const nextBox = allBoxes[currentStep];
  nextChickenBox = nextBox; // Store the target box

  // Mark visited and set danger/safe type
  currentChickenBox = nextBox;
  visitedBoxes.add(currentChickenBox);

  if (!currentChickenBox.dataset.type) {
    if (manuallyDangerBoxes.has(currentChickenBox)) {
      currentChickenBox.dataset.type = "danger";
      currentChickenBox.classList.add("danger-box");
    } else {
      const isSafe = Math.random() < 0.5; //safe box controller
      if (isSafe) {
        currentChickenBox.dataset.type = "safe";
        currentChickenBox.classList.add("safe-box");
      } else {
        currentChickenBox.dataset.type = "danger";
        currentChickenBox.classList.add("danger-box");
      }
    }
  }

  // 🕐 Wait 1 second before moving chicken
  setTimeout(() => {
    const boxCenterX = nextBox.offsetLeft + nextBox.offsetWidth / 2;
    const chickenX = boxCenterX - chicken.offsetWidth / 2;

    chicken.style.transition = "left 0.2s ease";
    animationElement.style.transition = "left 0.2s ease";
    chicken.style.left = `${chickenX}px`;
    animationElement.style.left = `${chickenX}px`;
    checkWinCondition();

    playSoundEffect("sound/cartoon-jump-6462.mp3");

    gameArea.scrollTo({
      left: nextBox.offsetLeft - 100,
      behavior: "smooth",
    });

    const previousStep = currentStep;
    currentStep++;

    // 🟡 Mark previous safe box with gold image
    if (previousStep > 0) {
      const prevBox = allBoxes[previousStep - 1];
      if (prevBox.dataset.type === "safe") {
        // ✅ Remove old profit icon if any
        const oldIcon = prevBox.querySelector(".gold-icon");
        if (oldIcon) oldIcon.remove();
        // Remove old one if exists (safety)
        const oldTag = currentChickenBox.querySelector(".winning-tag");
        if (oldTag) oldTag.remove();

        // ✅ Create gold image icon
        const goldImg = document.createElement("img");
        goldImg.src = "/chicken2img/coin.webp";
        goldImg.style.width = "40px";
        goldImg.classList.add("gold-icon"); // So we can manage it later
        goldImg.style.position = "absolute";
        goldImg.style.top = "48%";
        goldImg.style.left = "15%";
        goldImg.style.zIndex = "1";
        goldImg.style.width = "62%";

        prevBox.appendChild(goldImg);
      }
    }

    setTimeout(() => {
      const boxType = nextBox.dataset.type;
      if (nextBox.id === "winbox") {
        // Chicken reached the winbox — no barriers, no cars
        console.log("Chicken reached winbox. Skipping barrier and car spawn.");
        return; // Exit early to skip the rest of the logic
      }

      if (boxType === "safe" && !nextBox.classList.contains("winhome")) {
        if (currentStep < multiplierSequence.length) {
          winAmount = Math.floor(betAmount * multiplierSequence[currentStep]);
          cashoutBtn.textContent = `Cash Out ₹${winAmount}`;
          console.log(
            `Safe step ${currentStep} → Multiplier: ${multiplierSequence[currentStep]}x → Win: ₹${winAmount}`
          );
        }
        // REMOVE profit button from the box if exists
        // ✅ Remove all previous winning tags
        document
          .querySelectorAll(".winning-tag")
          .forEach((tag) => tag.remove());

        const profitBtn = currentChickenBox.querySelector(".profitshow");
        if (profitBtn) {
          const winValue = profitBtn.innerText;

          // Animate hiding of profit button
          profitBtn.classList.add("flip-out");
          setTimeout(() => {
            profitBtn.style.display = "none";

            // ✅ Create and show winning tag under chicken
            const winTag = document.createElement("div");
            winTag.innerText = winValue;
            winTag.classList.add("winning-tag");

            currentChickenBox.appendChild(winTag);
          }, 100);
        }

        const shouldSpawnCar = Math.random() < 0.5; //stop cars controller
        if (shouldSpawnCar) {
          spawnCarInChickenBox(currentChickenBox);
          playSoundEffect("sound/breakkk.mp3");
        }

        const barrier = document.createElement("div");
        barrier.classList.add("barrier");
        barrier.innerHTML = `<img src="/chicken2img/Barricade.webp" alt="" style="width: 150px;">`;
        nextBox.appendChild(barrier);
        setTimeout(() => barrier.classList.add("animate-drop"), 50);

        // Remove car inside the box if any
        const boxRect = nextBox.getBoundingClientRect();
        const carsInBox = document.querySelectorAll(".moving-car");

        carsInBox.forEach((car) => {
          const carRect = car.getBoundingClientRect();
          const isInsideBox = !(
            carRect.right < boxRect.left ||
            carRect.left > boxRect.right ||
            carRect.bottom < boxRect.top ||
            carRect.top > boxRect.bottom
          );

          if (isInsideBox) {
            car.remove();
          }
        });

        checkCollision();
      } else if (boxType === "danger") {
        chicken.style.display = "none";

        const deadChickenImg = document.createElement("img");
        deadChickenImg.src = "/chicken2img/dead.gif";
        deadChickenImg.className = "dead";
        deadChickenImg.style.position = "absolute";
        deadChickenImg.style.top = "60px";
        deadChickenImg.style.left = "40px";
        deadChickenImg.style.width = "80%";
        deadChickenImg.style.height = "100%";
        deadChickenImg.style.objectFit = "contain";
        deadChickenImg.style.display = "block";

        playSoundEffect("sound/deadchicken.mp3");

        document.querySelectorAll(".dead").forEach((img) => img.remove());
        nextBox.appendChild(deadChickenImg);

        const boxCenter = nextBox.offsetLeft + nextBox.offsetWidth / 2;
        const carLeft = boxCenter;
        const randomCar = cars[Math.floor(Math.random() * cars.length)];
        const dangerCar = randomCar.cloneNode(true);

        dangerCar.style.position = "absolute";
        dangerCar.style.left = `${carLeft}px`;
        dangerCar.style.top = `-150px`;
        dangerCar.style.display = "block";
        dangerCar.style.zIndex = "999";
        dangerCar.style.transition = "top 700ms linear";
        dangerCar.classList.add("moving-car");

        gameArea.appendChild(dangerCar);
        void dangerCar.offsetWidth;
        dangerCar.style.top = `${gameArea.offsetHeight + 200}px`;

        setTimeout(() => {
          dangerCar.remove();
        }, 600);
        setTimeout(() => {
          showGameOverPopup();
        }, 400);

        setTimeout(() => {
          deadChickenImg.remove();
        }, 2300);
      } else {
        checkCollision();
      }
    }, 500); // Inner delay for car logic
  }, 300); // Delay before chicken moves

  markDangerBoxManually();
  moveRandomCars();
});
function checkWinCondition() {
  const chicken = document.getElementById("chicken");
  const winbox = document.getElementById("winbox");

  const chickenRect = chicken.getBoundingClientRect();
  const winboxRect = winbox.getBoundingClientRect();

  const isInWinbox =
    chickenRect.top < winboxRect.bottom &&
    chickenRect.bottom > winboxRect.top &&
    chickenRect.left < winboxRect.right &&
    chickenRect.right > winboxRect.left;

  if (isInWinbox) {
    chicken.src = "chicken2img/chicken_walk 2.gif";
    chicken.style.transition = "left 7s ease";
    chicken.style.position = "absolute";
    chicken.style.left = "320%";

    playSoundEffect("/sound/Untitled video - Made with Clipchamp.m4a");
    playSoundEffect("/sound/Untitled video - Made with Clipchamp (1).m4a");

    // ✅ Prevent double add
    if (!checkWinCondition.amountAdded) {
      balance += winAmount;
      walletBtn.textContent = `${balance} ₹`;
      checkWinCondition.amountAdded = true; // mark as added
    }

    winAmountSpan.textContent = winAmount;
    hasBetPlaced = false;
    cashoutBtn.style.display = "none";
    cashoutBtn.textContent = "Cash Out";

    cashOutPopup.style.display = "block";
    setTimeout(() => {
      cashOutPopup.style.display = "none";
    }, 3000);

    minBtn.disabled = false;
    maxBtn.disabled = false;
    fixedBetBtns.forEach((btn) => (btn.disabled = false));
    document
      .querySelectorAll(".chnmod")
      .forEach((btn) => (btn.disabled = false));

    setTimeout(() => {
      restartGame();
      checkWinCondition.amountAdded = false; // reset for next round
    }, 9000);
  }
}

// Call this function repeatedly, e.g., in a game loop or with setInterval
setInterval(checkWinCondition, 100); // Check every 100ms

function moveRandomCars() {
  console.log("moveRandomCars called");
  // Clear old timeouts
  carIntervals.forEach((id) => clearTimeout(id));
  carIntervals = [];

  const animationTime = 1200;
  const spawnInterval = 3000;
  const carsPerSet = 5;
  // 🛑 Indexes of boxes where car should NOT spawn
  const noCarBoxIndexes = [17, 18, 19]; // ✨ Set your blocked indexes here

  if (cars.length === 0) {
    console.warn("No .car elements found.");
    return;
  }

  function spawnCars() {
    if (gameOver) return;
    if (currentChickenBox && currentChickenBox.id === "winbox") return;

    for (let i = 0; i < carsPerSet; i++) {
      const originalCar = cars[i % cars.length];
      const carClone = originalCar.cloneNode(true);

      let box;
      let tries = 0;

      // 🔁 Try to find a valid box to spawn
      do {
        box = allBoxes[Math.floor(Math.random() * allBoxes.length)];
        tries++;
      } while (
        (visitedBoxes.has(box) ||
          box === nextChickenBox ||
          box.id === "winbox" ||
          box.classList.contains("winfinal") ||
          box.dataset.hasCar === "true" || // 🚫 Already has a car
          noCarBoxIndexes.includes([...allBoxes].indexOf(box))) && // ✨ Skip if in blocked list
        tries < 20
      );

      if (
        !box ||
        visitedBoxes.has(box) ||
        box === nextChickenBox ||
        noCarBoxIndexes.includes([...allBoxes].indexOf(box))
      ) {
        continue;
      }
      const boxCenter = box.offsetLeft + box.offsetWidth / 2;
      const startTop = -150;

      const chickenInSafeBox =
        currentChickenBox &&
        currentChickenBox.dataset.type === "safe" &&
        currentChickenBox === box;

      const carStopTop = chickenInSafeBox
        ? box.offsetTop - originalCar.offsetHeight - 20
        : gameArea.offsetHeight + 100;

      carClone.style.position = "absolute";
      carClone.style.left = `${boxCenter}px`;
      carClone.style.top = `${startTop}px`;
      carClone.style.display = "block";
      carClone.style.transition = `top ${animationTime}ms linear`;
      carClone.style.zIndex = "10";
      carClone.classList.add("moving-car");
      gameArea.appendChild(carClone);

      // Trigger reflow
      void carClone.offsetWidth;
      carClone.style.top = `${carStopTop}px`;

      // Block the box if chicken is there
      if (chickenInSafeBox) {
        const alreadyBlocked = box.getAttribute("data-blocked") === "true";
        if (alreadyBlocked) continue;
        box.setAttribute("data-blocked", "true");
      }

      // Collision detection (only if danger box)
      let animation;
      if (box.dataset.type === "danger" && currentChickenBox === box) {
        animation = setInterval(() => {
          const carRect = carClone.getBoundingClientRect();
          const chickenRect = chicken.getBoundingClientRect();

          if (checkCollision(carRect, chickenRect)) {
            console.log("🔥 Chicken hit!");
            showGameOverPopup();
            gameOver = true;
            clearInterval(animation);
            carClone.remove();
          }
        }, 100);
      }

      const hideTimeout = setTimeout(() => {
        clearInterval(animation);
        carClone.remove();
      }, animationTime);

      carIntervals.push(hideTimeout);
    }

    const repeatTimeout = setTimeout(spawnCars, spawnInterval);
    carIntervals.push(repeatTimeout);
  }

  spawnCars();
}

function clearCarAnimations() {
  carIntervals.forEach((id) => clearTimeout(id));
  carIntervals = [];

  // Remove all cloned cars
  document.querySelectorAll(".moving-car").forEach((car) => car.remove());
}

function checkCollision() {
  const chickenRect = chicken.getBoundingClientRect();

  const movingCars = document.querySelectorAll(".moving-car");
  for (let car of movingCars) {
    const carRect = car.getBoundingClientRect();

    const overlap = !(
      chickenRect.right < carRect.left ||
      chickenRect.left > carRect.right ||
      chickenRect.bottom < carRect.top ||
      chickenRect.top > carRect.bottom
    );

    if (overlap) {
      // 🐔 Swap images
      gameOver = true;
      chicken.style.display = "none";
      deadchicken.style.display = "block";
      showGameOverPopup();
      break;
    }
  }
}

function showGameOverPopup() {
  gameOver = true;
  gameOverPopup.style.display = "block";
  playBtn.disabled = true;

  minBtn.disabled = false;
  maxBtn.disabled = false;
  cashoutBtn.style.display = "none";
  cashoutBtn.textContent = "Cash Out";
  fixedBetBtns.forEach((btn) => (btn.disabled = false));
  document.querySelectorAll(".chnmod").forEach((btn) => (btn.disabled = false));
  clearCarAnimations();

  // 🔁 Auto restart after 2 seconds
  setTimeout(() => {
    cashoutBtn.disabled = true;
    restartGame();
  }, 2000);
}

function restartGame() {
  gameOver = false;
  currentStep = 0;
  hasBetPlaced = false; // ✅ ensure bet doesn't double next round
  modedropdown.disabled = false;
  betAmount = 0; // optional safety
  winAmount = 0; // ✅ Clear previous win
  gameOverPopup.style.display = "none";
  playBtn.disabled = false;

  visitedBoxes.clear();
  stoppedCars.clear();

  allBoxes.forEach((box) => {
    box.removeAttribute("data-blocked");
    box.removeAttribute("data-type");
    box.classList.remove("safe-box", "danger-box");
  });

  chicken.style.display = "block";
  chicken.src = "/chicken2img/C_I_A New.gif";
  // ✨ Animate chicken to move right (off-screen)
  chicken.style.transition = "none";

  // Reset chicken position
  chicken.style.left = `${initialChickenX}px`;
  chicken.style.top = `${initialChickenY}px`;

  // Scroll back
  gameArea.scrollTo({
    left: 0,
    behavior: "smooth",
  });

  clearCarAnimations(); // clear old cars
  removeAllSpawnedCars();

  document.querySelectorAll(".barrier").forEach((b) => (b.innerHTML = ""));
  // ❌ Remove all gold icons
  document.querySelectorAll(".gold-icon").forEach((icon) => icon.remove());
  // ✅ Remove all winning tags when game ends
  document.querySelectorAll(".winning-tag").forEach((tag) => tag.remove());

  // Show all .profitshow buttons again and reset them
  document.querySelectorAll(".profitshow").forEach((btn) => {
    btn.style.display = "flex"; // or "" to reset to default
    btn.classList.remove("flip-out"); // remove hiding animation
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initialChickenX = chicken.offsetLeft;
  initialChickenY = chicken.offsetTop;
});
