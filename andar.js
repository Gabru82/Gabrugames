/* Win conditions */

function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
      // Portrait
      document.getElementById("rotate-warning").style.display = "flex";
      document.body.style.display = "none";
    } else {
      // Landscape
      document.getElementById("rotate-warning").style.display = "none";
      document.body.style.display = "block";
    }
  }

  window.addEventListener("resize", checkOrientation);
  window.addEventListener("load", checkOrientation);
const suits = ["p", "e", "h", "c"]; // your suit codes
const colors = { p: "r", e: "r", h: "b", c: "b" };
const numberRanges = {
  a: [1, 2, 3, 4, 5, 6],
  7: [7],
  k: [8, 9, 10, 11, 12, 13],
};
const ranks = Array.from({ length: 13 }, (_, i) => i + 1); // 1..13

/* User selections */
let selectedCards = [];
let selectedSuits = [];
let selectedColors = [];
let selectedRanges = [];
let selectedSides = [];
let selectedAmount = 0;
let lastPlacedSelections = null;
let roundStartTime = Date.now();
let globalSecondsLeft = 60;
let hasCheckedInitialLoad = false;
let lastPlacedBets = {}; // Tracks what was already deducted
const cardBets = {}; // bets per card rank (1..13)
const suitBets = {};
let colorBets = {};
const rangeBets = {};
const sideBets = {};

/* UI elements */
const rangeAto6Btn = document.getElementById("rangeAto6");
const range7Btn = document.getElementById("range7");
const range8toKBtn = document.getElementById("range8toK");
const andarBtn = document.getElementById("andarBtn");
const baharBtn = document.getElementById("baharBtn");
const coinButtons = document.querySelectorAll(".coin");
const cardWrappers = document.querySelectorAll(".card-wrapper");
const suitButtons = document.querySelectorAll(".iconbtn");
const colorButtons = document.querySelectorAll(".colcard");
const betButton = document.getElementById("betOkBtn");

/* Local wallet & round */
let userWallet = 1000.00; // starting local wallet — change as desired
let currentPeriodId = 1;

/* Utility: get element safely */
function safeGet(id) { return document.getElementById(id); }

/* ---------------- Local "API" functions ---------------- */
/* Generate a local draw object with structure { win_number, periodid, user_wallet }.
   win_number format: "<position><suit><rank>" e.g. "1p5" or "2h12". Position: 1=Andar,2=Bahar
*/
function generateLocalDraw() {
  // Random position (1 or 2)
  const position = Math.random() < 0.5 ? 1 : 2;
  // Random suit
  const suit = suits[Math.floor(Math.random() * suits.length)];
  // Random rank 1..13
  const rank = Math.floor(Math.random() * 13) + 1;
  const win_number = `${position}${suit}${rank}`;
  return {
    win_number,
    periodid: currentPeriodId,
    user_wallet: userWallet,
  };
}

/* Replace fetchAndharFunTarget — returns a Promise resolving to local draw */
async function fetchAndharFunTarget() {
  // Simulate small delay for UX (not network)
  await new Promise((r) => setTimeout(r, 50));
  return generateLocalDraw();
}

/* Replace sendBet with a local version that just logs and returns success */
async function localSendBet(betPayload) {
  // simulate server processing latency
  await new Promise((r) => setTimeout(r, 100));

  // For local play, we simply confirm the bet and return updated wallet
  // bets is array like [{ key: amount }, ...] as in your payload
  // We already deducted locally before calling send; here we "confirm"
  return {
    success: true,
    user_wallet: userWallet,
    periodid: currentPeriodId,
    message: "Local bet accepted",
  };
}

/* ---------------- Betting logic (unchanged but using localSendBet) ---------------- */
let selectedBets = {};
const sideMapping = { 1: "i", 2: "o" };

function buildSelectedBets() {
  const bets = {};

  for (const card in cardBets) if (cardBets[card]) bets[`${card}`] = cardBets[card];
  for (const suit in suitBets) if (suitBets[suit]) bets[`${suit}`] = suitBets[suit];
  for (const color in colorBets) if (colorBets[color]) bets[`${color}`] = colorBets[color];
  for (const range in rangeBets) if (rangeBets[range]) bets[`${range}`] = rangeBets[range];
  for (const side in sideBets) {
    const mappedKey = sideMapping[side];
    if (mappedKey) bets[`${mappedKey}`] = sideBets[side];
  }

  return bets;
}

function placeBet() {
  selectedBets = buildSelectedBets();

  let newBetAmount = 0;
  const newBets = {};

  for (const key in selectedBets) {
    const currentAmount = selectedBets[key] || 0;
    const previousAmount = lastPlacedBets[key] || 0;
    const diff = currentAmount - previousAmount;
    if (diff > 0) {
      newBets[key] = diff;
      newBetAmount += diff;
    }
  }

  const messageEl = safeGet("betMessage");

  if (newBetAmount === 0) {
    if (messageEl) {
      messageEl.style.display = "block";
      setTimeout(() => (messageEl.style.display = "none"), 2000);
    }
    return;
  }

  if (newBetAmount > userWallet) {
    console.log("Insufficient balance");
    return;
  }

  // build payload (local)
  const betsArray = Object.entries(newBets).map(([key, value]) => ({ [key]: value }));
  const betPayload = {
    token: "+LOCAL",
    gamename: "andar_bahar",
    periodid: currentPeriodId,
    Total_betamount: newBetAmount,
    gameid: 4,
    bets: betsArray,
  };

  lastPlacedSelections = {
    sides: [...selectedSides],
    suits: [...selectedSuits],
    colors: [...selectedColors],
    ranges: [...selectedRanges],
    cards: [...selectedCards],
    amount: selectedAmount,
  };

  // Deduct locally immediately
  userWallet -= newBetAmount;
  const betCountEl = document.querySelector(".betcount");
  if (betCountEl) {
    const previousTotal = parseFloat(betCountEl.textContent) || 0;
    betCountEl.textContent = (previousTotal + newBetAmount).toFixed(2);
  }
  const walletEl = document.getElementById("wallet");
  if (walletEl) walletEl.textContent = userWallet.toFixed(2);

  // "Send" bet locally
  localSendBet(betPayload)
    .then((res) => {
      if (res && res.success) {
        // Update lastPlacedBets only for new bets
        for (const key in newBets) {
          lastPlacedBets[key] = (lastPlacedBets[key] || 0) + newBets[key];
        }
        console.log("Local bet accepted:", betPayload);
      } else {
        // rollback on failure
        userWallet += newBetAmount;
        if (walletEl) walletEl.textContent = userWallet.toFixed(2);
        console.warn("Local bet failed");
      }
    })
    .catch((err) => {
      userWallet += newBetAmount;
      if (walletEl) walletEl.textContent = userWallet.toFixed(2);
      console.error("Local bet error:", err);
    });
}

if (betButton) {
  betButton.addEventListener("click", placeBet);
}

/* ---------------- UI interactions for selecting bets ---------------- */
/* coin buttons */
coinButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    coinButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAmount = parseInt(btn.id.replace("coin", "")) || 0;
    console.log("Selected Bet Amount:", selectedAmount);
  });
});

/* card selection (multi) */
cardWrappers.forEach((card) => {
  card.addEventListener("click", () => {
    const cardValue = parseInt((card.dataset.symbol || "").replace(/[^\d]/g, "")) || parseInt(card.dataset.rank) || null;

    if (!selectedAmount || selectedAmount <= 0) {
      alert("Please select a coin amount first.");
      return;
    }

    if (!card.classList.contains("active")) card.classList.add("active");
    if (cardValue && !selectedCards.includes(cardValue)) selectedCards.push(cardValue);

    // create coin image overlay
    const coinImg = document.createElement("img");
    coinImg.src = `anderbaharimg/${selectedAmount}.png`;
    coinImg.classList.add("coinImage");
    const coinCount = card.querySelectorAll(".coinImage").length;
    coinImg.style.position = "absolute";
    coinImg.style.bottom = `${10 + coinCount * 5}px`;
    coinImg.style.right = "10px";
    coinImg.style.width = "40px";
    coinImg.style.height = "40px";
    coinImg.style.zIndex = 10;
    card.appendChild(coinImg);

    if (!cardBets[cardValue]) cardBets[cardValue] = 0;
    cardBets[cardValue] += selectedAmount;

    console.log("Updated cardBets:", cardBets);
  });
});

/* suit buttons */
suitButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const suitValue = btn.dataset.symbol;
    if (!selectedAmount || selectedAmount <= 0) {
      alert("Please select a coin amount first.");
      return;
    }
    if (!btn.classList.contains("active")) btn.classList.add("active");
    if (!selectedSuits.includes(suitValue)) selectedSuits.push(suitValue);

    const coinImg = document.createElement("img");
    coinImg.src = `anderbaharimg/${selectedAmount}.png`;
    coinImg.classList.add("coinImage");
    const coinCount = btn.querySelectorAll(".coinImage").length;
    coinImg.style.position = "absolute";
    coinImg.style.top = `${10 + coinCount * 5}px`;
    coinImg.style.right = "10px";
    coinImg.style.width = "30px";
    coinImg.style.height = "30px";
    coinImg.style.zIndex = 10;
    btn.style.position = "relative";
    btn.appendChild(coinImg);

    if (!suitBets[suitValue]) suitBets[suitValue] = 0;
    suitBets[suitValue] += selectedAmount;

    console.log("Updated suitBets:", suitBets);
  });
});

/* color buttons */
colorButtons.forEach((btn, idx) => {
  btn.addEventListener("click", () => {
    const colorValue = idx === 0 ? "r" : "b";
    if (!selectedAmount || selectedAmount <= 0) {
      alert("Please select a coin amount first.");
      return;
    }
    if (!btn.classList.contains("active")) btn.classList.add("active");
    if (!selectedColors.includes(colorValue)) selectedColors.push(colorValue);

    const coinImg = document.createElement("img");
    coinImg.src = `anderbaharimg/${selectedAmount}.png`;
    coinImg.classList.add("coinImage");
    const coinCount = btn.querySelectorAll(".coinImage").length;
    coinImg.style.position = "absolute";
    coinImg.style.top = `${10 + coinCount * 5}px`;
    coinImg.style.right = "10px";
    coinImg.style.width = "30px";
    coinImg.style.height = "30px";
    coinImg.style.zIndex = 10;
    btn.style.position = "relative";
    btn.appendChild(coinImg);

    if (!colorBets) colorBets = {};
    if (!colorBets[colorValue]) colorBets[colorValue] = 0;
    colorBets[colorValue] += selectedAmount;

    console.log("Updated colorBets:", colorBets);
  });
});

/* range buttons */
const rangeButtons = [rangeAto6Btn, range7Btn, range8toKBtn];
rangeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    let rangeValue = null;
    if (btn === rangeAto6Btn) rangeValue = "a";
    else if (btn === range7Btn) rangeValue = "7";
    else if (btn === range8toKBtn) rangeValue = "k";

    if (!selectedAmount || selectedAmount <= 0) {
      alert("Please select a coin amount first.");
      return;
    }

    if (!btn.classList.contains("active")) btn.classList.add("active");
    if (!selectedRanges.includes(rangeValue)) selectedRanges.push(rangeValue);

    const coinImg = document.createElement("img");
    coinImg.src = `anderbaharimg/${selectedAmount}.png`;
    coinImg.classList.add("coinImage");
    const coinCount = btn.querySelectorAll(".coinImage").length;
    coinImg.style.position = "absolute";
    coinImg.style.top = `${10 + coinCount * 5}px`;
    coinImg.style.right = "10px";
    coinImg.style.width = "30px";
    coinImg.style.height = "30px";
    coinImg.style.zIndex = 10;
    btn.style.position = "relative";
    btn.appendChild(coinImg);

    if (!rangeBets[rangeValue]) rangeBets[rangeValue] = 0;
    rangeBets[rangeValue] += selectedAmount;

    console.log("Updated rangeBets:", rangeBets);
  });
});

/* side buttons */
const sideButtons = [andarBtn, baharBtn];
sideButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sideValue = btn === andarBtn ? 1 : 2;
    if (!selectedAmount || selectedAmount <= 0) {
      alert("Please select a coin amount first.");
      return;
    }
    if (!btn.classList.contains("active")) btn.classList.add("active");
    if (!selectedSides.includes(sideValue)) selectedSides.push(sideValue);

    const coinImg = document.createElement("img");
    coinImg.src = `anderbaharimg/${selectedAmount}.png`;
    coinImg.classList.add("coinImage");
    const coinCount = btn.querySelectorAll(".coinImage").length;
    coinImg.style.position = "absolute";
    coinImg.style.top = `${10 + coinCount * 5}px`;
    coinImg.style.right = "10px";
    coinImg.style.width = "30px";
    coinImg.style.height = "30px";
    coinImg.style.zIndex = 10;
    btn.style.position = "relative";
    btn.appendChild(coinImg);

    if (!sideBets[sideValue]) sideBets[sideValue] = 0;
    sideBets[sideValue] += selectedAmount;

    console.log("Updated sideBets:", sideBets);
  });
});

/* ---------------- Card rendering & scrolling helpers ---------------- */
function parseWinNumber(winNumber) {
  const position = parseInt(winNumber.charAt(0), 10); // 1 = Andar, 2 = Bahar
  const suit = winNumber.charAt(1); // suit code
  const rank = parseInt(winNumber.slice(2), 10); // number
  return { position, suit, rank };
}

function drawCardFromAPI(apiData) {
  if (!apiData || !apiData.win_number) return null;
  const winNumber = apiData.win_number;
  const position = parseInt(winNumber[0], 10);
  const suit = winNumber[1];
  const rank = parseInt(winNumber.slice(2), 10);
  const color = colors[suit];
  return { position, suit, rank, color };
}

const createCardImg = (suit, rank) => {
  const img = document.createElement("img");
  img.src = `Cards/${suit}${rank}.png`;
  img.alt = `${suit}${rank}`;
  return img;
};

function generateCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const img = document.createElement("img");
      img.src = `Cards/${suit}${rank}.png`;
      img.dataset.suit = suit;
      img.dataset.rank = rank;
      img.classList.add("scroll-card");
      container.appendChild(img);
    });
  });
  const clone = container.cloneNode(true);
  while (clone.firstChild) container.appendChild(clone.firstChild);
}

let scrollContainer = null;
function startScroll() {
  const container = document.getElementById("cardshow-inner");
  if (!container) return;
  container.innerHTML = "";

  scrollContainer = document.createElement("div");
  scrollContainer.classList.add("scroll-track");
  container.appendChild(scrollContainer);

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const img = document.createElement("img");
      img.src = `Cards/${suit}${rank}.png`;
      img.classList.add("scroll-card");
      scrollContainer.appendChild(img);
    });
  });
  // duplicate
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const img = document.createElement("img");
      img.src = `Cards/${suit}${rank}.png`;
      img.classList.add("scroll-card");
      scrollContainer.appendChild(img);
    });
  });
}

function stopScrollAndShow(winNumber) {
  const { suit, rank } = parseWinNumber(winNumber);
  const container = document.getElementById("cardshow-inner");
  if (!container) return;
  container.innerHTML = "";
  const img = document.createElement("img");
  img.src = `Cards/${suit}${rank}.png`;
  img.dataset.suit = suit;
  img.dataset.rank = rank;
  img.dataset.color = colors[suit];
  img.classList.add("scroll-stop");
  container.appendChild(img);
  console.log("Middle Card:", { suit, rank, color: colors[suit] });
}

function showMiddleCard(winNumber) {
  const { suit, rank } = parseWinNumber(winNumber);
  const container = document.getElementById("cardshow-inner");
  if (!container) return;
  container.innerHTML = "";
  const img = document.createElement("img");
  img.src = `Cards/${suit}${rank}.png`;
  img.dataset.suit = suit;
  img.dataset.rank = rank;
  img.dataset.color = colors[suit];
  container.appendChild(img);
}

function startSideScroll(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const scrollTrack = document.createElement("div");
  scrollTrack.classList.add("scroll-track");
  container.appendChild(scrollTrack);

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const img = document.createElement("img");
      img.src = `Cards/${suit}${rank}.png`;
      img.classList.add("scroll-card");
      scrollTrack.appendChild(img);
    });
  });
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const img = document.createElement("img");
      img.src = `Cards/${suit}${rank}.png`;
      img.classList.add("scroll-card");
      scrollTrack.appendChild(img);
    });
  });
}

function stopSideScroll(winNumber) {
  const { position, suit, rank } = parseWinNumber(winNumber);
  const winnerId = position === 1 ? "andar" : "bahar";
  const loserId = position === 1 ? "bahar" : "andar";

  const winContainer = document.getElementById(winnerId);
  if (winContainer) {
    winContainer.innerHTML = "";
    const winImg = document.createElement("img");
    winImg.src = `Cards/${suit}${rank}.png`;
    winImg.dataset.suit = suit;
    winImg.dataset.rank = rank;
    winImg.dataset.color = colors[suit];
    winImg.classList.add("scroll-stop");
    winContainer.appendChild(winImg);
  }

  const loseContainer = document.getElementById(loserId);
  if (loseContainer) {
    loseContainer.innerHTML = "";
    let randomSuit, randomRank;
    do {
      randomSuit = suits[Math.floor(Math.random() * suits.length)];
      randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    } while (randomSuit === suit && randomRank === rank);

    const loseImg = document.createElement("img");
    loseImg.src = `Cards/${randomSuit}${randomRank}.png`;
    loseImg.dataset.suit = randomSuit;
    loseImg.dataset.rank = randomRank;
    loseImg.dataset.color = colors[randomSuit];
    loseImg.classList.add("scroll-stop");
    loseContainer.appendChild(loseImg);
  }

  console.log("Placed in:", winnerId, "MATCH card");
  console.log("Placed in:", loserId, "RANDOM card");
}

function placeCardInSide(winNumber) {
  if (!winNumber) return;
  const { position, suit, rank } = parseWinNumber(winNumber);
  const img = document.createElement("img");
  img.src = `Cards/${suit}${rank}.png`;
  img.dataset.suit = suit;
  img.dataset.rank = rank;
  const cardColor = colors[suit];
  img.dataset.color = cardColor;
  img.dataset.position = position;
  img.classList.add("side-card", "scroll-up-settle");
  const container = position === 1 ? document.getElementById("andar") : document.getElementById("bahar");
  if (container) { container.innerHTML = ""; container.appendChild(img); }
  console.log("Placed in:", position === 1 ? "Andar" : "Bahar", { suit, rank, color: cardColor });
}

function exitCard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const card = container.querySelector("img");
  if (!card) return;
  card.classList.remove("scroll-up-settle");
  card.classList.add("scroll-up-exit");
  card.addEventListener("animationend", () => { container.innerHTML = ""; });
}

/* ---------------- Result processing & history ---------------- */
let resultProcessed = false;
let drawHistory = []; // store last 3 drawn cards

function updateHistory(drawnCard) {
  drawHistory.unshift(drawnCard);
  if (drawHistory.length > 3) drawHistory.pop();

  const historyImgs = [safeGet("img5"), safeGet("img7"), safeGet("img9")];
  historyImgs.forEach((img, index) => {
    const card = drawHistory[index];
    if (img && card) {
      img.src = `Cards/${card.suit}${card.rank}.png`;
      img.alt = `${card.suit}${card.rank}`;
    }
  });
}

function checkUserWin(drawn, selections) {
  const { sides, suits: selSuits, colors: userColors, ranges, cards } = selections;
  const results = [];

  if (sides?.length) {
    sides.forEach((side) => {
      const win = side == drawn.position;
      results.push({
        type: "Side",
        selection: side,
        win,
        explanation: win ? `User selected side ${side}, matched` : `User selected ${side}, did not match ${drawn.position}`,
      });
    });
  }
  if (selSuits?.length) {
    selSuits.forEach((suit) => {
      const win = suit === drawn.suit;
      results.push({ type: "Suit", selection: suit, win, explanation: win ? "matched suit" : `api suit ${drawn.suit}` });
    });
  }
  if (userColors?.length) {
    userColors.forEach((color) => {
      const win = color === drawn.color;
      results.push({ type: "Color", selection: color, win, explanation: win ? "matched color" : `api color ${drawn.color}` });
    });
  }
  if (ranges?.length) {
    ranges.forEach((range) => {
      let win = false;
      if (range === "a") win = numberRanges.a.includes(drawn.rank);
      if (range === "7") win = numberRanges["7"].includes(drawn.rank);
      if (range === "k") win = numberRanges.k.includes(drawn.rank);
      results.push({ type: `Range ${range}`, selection: range, win, explanation: win ? `rank ${drawn.rank} in range` : `rank ${drawn.rank} not in range` });
    });
  }
  if (cards?.length) {
    cards.forEach((rank) => {
      const win = rank === drawn.rank;
      results.push({ type: `Exact Card ${rank}`, selection: rank, win, explanation: win ? "exact match" : `api ${drawn.rank}` });
    });
  }

  return results;
}

/* processResult: iterate selectedBets and payout simple multiplier (example 2x for win) */
function processResult(drawData) {
  if (!drawData) return;
  const winNumber = drawData.win_number;
  const drawn = drawCardFromAPI(drawData);
  const results = [];

  Object.entries(selectedBets).forEach(([betKey, betAmount]) => {
    if (betKey === `p${drawn.rank}` || betKey === `${drawn.suit}${drawn.rank}`) {
      results.push({ betKey, betAmount, win: true });
      userWallet += betAmount * 2; // example payout
    } else {
      results.push({ betKey, betAmount, win: false });
    }
  });

  console.log("Local results:", results);
  const walletEl = document.getElementById("wallet");
  if (walletEl) walletEl.textContent = userWallet.toFixed(2);

  resetSelections();
}

/* ---------------- Timer & round flow (uses local fetch) ---------------- */
function createSlotTimer(slotDurationMs = 300_000, onUpdate) {
  let intervalId = null;
  const update = () => {
    const now = Date.now() - 10000; // 10s delay
    const remaining = Math.floor((slotDurationMs - (now % slotDurationMs)) / 1000);
    const isBettingAllowed = remaining > 12;
    if (typeof onUpdate === "function") onUpdate({ secondsLeft: remaining, isBettingAllowed });
  };
  const start = () => { update(); intervalId = setInterval(update, 1000); };
  const stop = () => { if (intervalId) clearInterval(intervalId); };
  return { start, stop };
}

function showLoadingScreen(startSeconds) {
  const loadingEl = document.getElementById("loadingScreen");
  const countdownEl = document.getElementById("loadingCountdown");
  if (!loadingEl || !countdownEl) return;
  loadingEl.style.display = "block";
  countdownEl.textContent = startSeconds;
  let current = startSeconds;
  const interval = setInterval(() => {
    current--;
    countdownEl.textContent = current;
    if (current <= 0) {
      clearInterval(interval);
      loadingEl.style.display = "none";
    }
  }, 1000);
}

/* timer callback */
const timerElement = document.getElementById("timer");
let currentDraw = null;
const timer = createSlotTimer(60000, async ({ secondsLeft }) => {
  globalSecondsLeft = secondsLeft;

  if (secondsLeft === 59) {
    roundStartTime = Date.now();
    sessionStorage.setItem("roundStartTime", roundStartTime.toString());
  }

  if (timerElement) {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    timerElement.textContent = `${minutes}:${seconds}`;
  }

  if (secondsLeft === 12 && betButton) {
    betButton.disabled = true;
    betButton.classList.add("disabled");
    resultProcessed = false;
  }

  if (secondsLeft === 10) {
    startScroll();
  }

  if (secondsLeft === 7) {
    try {
      currentDraw = await fetchAndharFunTarget();
      if (currentDraw?.win_number) {
        console.log("Local Win Number:", currentDraw.win_number);
        stopScrollAndShow(currentDraw.win_number);
        startSideScroll("andar");
        startSideScroll("bahar");
      } else {
        console.warn("No local win_number");
      }
    } catch (err) {
      console.error("Local draw failed:", err);
    }
  }

  if (secondsLeft === 3 && !resultProcessed && currentDraw?.win_number) {
    resultProcessed = true;
    stopSideScroll(currentDraw.win_number);
    const drawnCard = drawCardFromAPI(currentDraw);
    showWinPopup(currentDraw.win_number);
    updateHistory(drawnCard);

    if (lastPlacedSelections) {
      const winResults = checkUserWin(drawnCard, lastPlacedSelections);
      let totalWinAmount = 0;
      winResults.forEach((r) => {
        if (r.win) {
          const winAmount = lastPlacedSelections.amount * 2;
          userWallet += winAmount;
          totalWinAmount += winAmount;
          console.log("User won on:", r.selection, "card:", drawnCard);
        } else {
          console.log("User lost on:", r.selection, "card:", drawnCard);
        }
      });

      const walletEl = document.getElementById("wallet");
      if (walletEl) walletEl.textContent = userWallet.toFixed(2);

      const winnerEl = document.getElementById("winner");
      if (winnerEl) winnerEl.textContent = totalWinAmount.toFixed(2);
    }
  }

  if (secondsLeft === 1) {
    exitCard("andar");
    exitCard("bahar");
    exitCard("cardshow-inner");
  }
  if (secondsLeft === 0 && betButton) {
    betButton.disabled = false;
    betButton.classList.remove("disabled");
    roundStartTime = Date.now();
    resetSelections();
    // increment local period & prepare next draw
    currentPeriodId += 1;
    currentDraw = null;
  }
});

timer.start();

/* On window load, restore round state if applicable and show loading if user joined late */
window.addEventListener("load", () => {
  const storedStart = sessionStorage.getItem("roundStartTime");
  if (!storedStart) return;
  const now = Date.now();
  const secondsSinceRoundStart = Math.floor((now - parseInt(storedStart)) / 1000);
  if (secondsSinceRoundStart >= 48 && secondsSinceRoundStart < 60) {
    const remaining = 60 - secondsSinceRoundStart;
    showLoadingScreen(remaining);
  }

  // Update wallet UI initial
  const walletEl = document.getElementById("wallet");
  if (walletEl) walletEl.textContent = userWallet.toFixed(2);
});

/* ---------------- Small helpers & UI functions ---------------- */
function showWinPopup(winNumber) {
  if (!winNumber) return;
  const { position, suit, rank } = parseWinNumber(winNumber);
  const sideName = position === 1 ? "Andar" : "Bahar";
  const suitNames = { p: "Heart", e: "Diamond", h: "Spade", c: "Club" };
  const suitName = suitNames[suit] || suit;
  const colorNames = { r: "Red", b: "Black" };
  const color = colorNames[colors[suit]] || "Unknown";
  const popupText = `${sideName} Win Suit: ${suitName}  Color: ${color}  Rank: ${rank}`;
  const popup = safeGet("winPopup");
  if (!popup) return;
  popup.textContent = popupText;
  popup.classList.add("show");
  popup.classList.remove("hide");
  setTimeout(() => { popup.classList.remove("show"); popup.classList.add("hide"); }, 3000);
}

/* showResult placeholder */
function showResult(card, results) { console.log("Result:", card, results); }

/* take button resets selections */
const takeButton = document.getElementById("takeBtn");
if (takeButton) takeButton.addEventListener("click", resetSelections);

/* resetSelections implementation */
function resetSelections() {
  selectedAmount = 0;
  selectedCards = [];
  selectedSuits = [];
  selectedColors = [];
  selectedRanges = [];
  selectedSides = [];
  lastPlacedSelections = null;
  lastPlacedBets = {};

  const allButtons = [...coinButtons, ...cardWrappers, ...suitButtons, ...colorButtons, ...rangeButtons, ...sideButtons];
  allButtons.forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".coinImage").forEach((img) => img.remove());

  [cardBets, suitBets, colorBets, rangeBets, sideBets].forEach((betObj) => {
    Object.keys(betObj).forEach((key) => { betObj[key] = 0; });
  });

  document.querySelectorAll(".betAmountDisplay").forEach((el) => { el.textContent = "₹0"; });
  const betCountEl = document.querySelector(".betcount");
  if (betCountEl) betCountEl.textContent = "0";
}