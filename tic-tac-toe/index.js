

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("statusText");
const menuOptions = document.querySelectorAll(".menu-option");
const menuContainer = document.getElementById("menuContainer");
const gameContainer = document.getElementById("gameContainer");
const clickSound = document.getElementById("clickSound");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");

function getNextSectionIndex(currentIndex) {
  const sections = document.querySelectorAll('.menu-section');
  const currentOption = menuOptions[currentIndex];
  const currentSection = currentOption.closest('.menu-section');
  
  let currentSectionIndex = -1;
  sections.forEach((section, index) => {
    if (section === currentSection) {
      currentSectionIndex = index;
    }
  });
  
  
  if (currentSectionIndex === -1 || currentSectionIndex === sections.length - 1) {
    return 0;
  }
  
  return currentSectionIndex + 1;
}

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let options = Array(9).fill("");
let currentPlayer = "X";
let currentSelection = 0;
let running = false;
let scanSpeed = 1000;
let isCpu = false;
let cpuLevel = "easy";
let player1Scan = true;
let player2Scan = true;
let inMenu = true;
let menuScanInterval = null;
let gameScanInterval = null;
let endButtons = [restartBtn, backToMenuBtn];

function playSound() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

function startMenuScan(startFrom = currentSelection) {
  let index = startFrom;
  stopMenuScan();
  menuScanInterval = setInterval(() => {
    menuOptions.forEach(opt => opt.blur());
    menuOptions[index].focus();
    currentSelection = index;
    index = (index + 1) % menuOptions.length;
  }, scanSpeed);
}

function stopMenuScan() {
  if (menuScanInterval) clearInterval(menuScanInterval);
}

function startGameScan() {
  stopGameScan();
  const focusableIndexes = options.map((v, i) => v === "" ? i : null).filter(i => i !== null);
  if (focusableIndexes.length === 0) return;
  let currentScan = 0;
  gameScanInterval = setInterval(() => {
    cells.forEach(cell => cell.blur());
    const index = focusableIndexes[currentScan];
    currentSelection = index;
    cells[index].focus();
    currentScan = (currentScan + 1) % focusableIndexes.length;
  }, scanSpeed);
}

function startEndButtonScan() {
  stopGameScan();
  let index = 0;
  gameScanInterval = setInterval(() => {
    endButtons.forEach(btn => btn.blur());
    endButtons[index].focus();
    currentSelection = index;
    index = (index + 1) % endButtons.length;
  }, scanSpeed);
}

function stopGameScan() {
  if (gameScanInterval) clearInterval(gameScanInterval);
}

function handleMenuClick() {
  const selected = menuOptions[currentSelection].dataset.option;

  if (selected.startsWith("speed")) {
    scanSpeed = selected === "speed-slow" ? 2000 : selected === "speed-medium" ? 1000 : 500;
  } else if (selected.startsWith("mode")) {
    isCpu = selected.includes("cpu");
    if (selected === "mode-cpu-easy") cpuLevel = "easy";
    if (selected === "mode-cpu-medium") cpuLevel = "medium";
    if (selected === "mode-cpu-hard") cpuLevel = "hard";
    player1Scan = true;
    player2Scan = false;
    if (selected === "mode-human-scan") {
      player1Scan = true;
      player2Scan = true;
    }
    if (selected === "mode-human-mixed") {
      player1Scan = true;
      player2Scan = false;
    }
  } else if (selected.startsWith("player")) {
    currentPlayer = selected === "player-x" ? "X" : "O";
    inMenu = false;
    stopMenuScan();
    setTimeout(startGame, 200);
    return;
  }

  const nextSectionIndex = getNextSectionIndex(currentSelection);
  const nextSection = document.querySelectorAll('.menu-section')[nextSectionIndex];
  const firstOptionInNextSection = nextSection.querySelector('.menu-option');
 
  
  let newIndex = 0;
  menuOptions.forEach((option, index) => {
    if (option === firstOptionInNextSection) {
      newIndex = index;
    }
  });
  

  startMenuScan(newIndex);
}

function startGame() {
  options = Array(9).fill("");
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("winner");
  });
  gameContainer.style.display = "block";
  menuContainer.style.display = "none";
  currentSelection = 0;
  running = true;
  updateStatus();
  if (shouldScan()) {
    startGameScan();
  } else if (shouldCpuPlay()) {
    setTimeout(cpuMove, 500);
  }
}

function shouldScan() {
  return (currentPlayer === "X" && player1Scan) || (currentPlayer === "O" && player2Scan);
}

function shouldCpuPlay() {
  return isCpu && ((currentPlayer === "X" && !player1Scan) || (currentPlayer === "O" && !player2Scan));
}

function handleGameClick() {
  if (!running) return;

  const focusableIndexes = options.map((v, i) => v === "" ? i : null).filter(i => i !== null);
  const index = focusableIndexes.includes(currentSelection) ? currentSelection : focusableIndexes[0];
  const cell = cells[index];

  if (options[index] !== "") return;

  options[index] = currentPlayer;
  cell.textContent = currentPlayer;
  playSound();

  const win = checkWinner();
  if (win) {
    win.forEach(i => cells[i].classList.add("winner"));
    statusText.textContent = `Jogador ${currentPlayer} venceu!`;
    running = false;
    startEndButtonScan();
    return;
  }

  if (!options.includes("")) {
    statusText.textContent = "Empate!";
    running = false;
    startEndButtonScan();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus();
  stopGameScan();
  if (shouldScan()) {
    startGameScan();
  } else if (shouldCpuPlay()) {
    setTimeout(cpuMove, 500);
  }
}

function cpuMove() {
  let move;
  const empty = options.map((v, i) => v === "" ? i : null).filter(i => i !== null);

  if (cpuLevel === "easy") {
    move = empty[Math.floor(Math.random() * empty.length)];
  } else if (cpuLevel === "medium") {
    move = findWinningMove(currentPlayer) || findBlockingMove() || empty[0];
  } else if (cpuLevel === "hard") {
    move = minimax(options, currentPlayer).index;
  }

  if (move !== undefined) {
    currentSelection = move;
    handleGameClick();
  }
}

function findWinningMove(player) {
  for (let i = 0; i < options.length; i++) {
    if (options[i] === "") {
      options[i] = player;
      if (checkWinner()) {
        options[i] = "";
        return i;
      }
      options[i] = "";
    }
  }
  return null;
}

function findBlockingMove() {
  return findWinningMove(currentPlayer === "X" ? "O" : "X");
}

function minimax(board, player) {
  const opponent = player === "X" ? "O" : "X";
  const empty = board.map((v, i) => v === "" ? i : null).filter(i => i !== null);

  if (checkStaticWin(board, player)) return { score: 1 };
  if (checkStaticWin(board, opponent)) return { score: -1 };
  if (empty.length === 0) return { score: 0 };

  const moves = [];

  for (let i of empty) {
    const newBoard = [...board];
    newBoard[i] = player;
    const result = minimax(newBoard, opponent);
    moves.push({ index: i, score: -result.score });
  }

  return moves.reduce((best, move) => move.score > best.score ? move : best);
}

function checkStaticWin(board, player) {
  return winConditions.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
}

function checkWinner() {
  for (const [a, b, c] of winConditions) {
    if (options[a] && options[a] === options[b] && options[a] === options[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function restartGame() {
  startGame();
}

function updateStatus() {
  statusText.textContent = `Vez do jogador ${currentPlayer}`;
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    if (inMenu) {
      handleMenuClick();
    } else if (!running) {
      if (currentSelection === 0) restartGame();
      else backToMenu();
    } else {
      handleGameClick();
    }
  }
});

document.addEventListener("click", () => {
  if (inMenu) {
    handleMenuClick();
  } else if (!running) {
    if (currentSelection === 0) restartGame();
    else backToMenu();
  } else {
    handleGameClick();
  }
});

restartBtn.addEventListener("click", restartGame);
backToMenuBtn.addEventListener("click", backToMenu);

function backToMenu() {
  stopGameScan();
  inMenu = true;
  menuContainer.style.display = "block";
  gameContainer.style.display = "none";
  startMenuScan();
}

startMenuScan();
