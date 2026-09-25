$(function () {
const cells = $(".cell").toArray();
const statusText = document.getElementById("statusText");
const gameContainer = document.getElementById("gameContainer");
const clickSound = document.getElementById("clickSound");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
bgMusic.volume = 0.16;
musicToggle.addEventListener("click", async () => {
  if (bgMusic.paused) {
    try {
      await bgMusic.play();
      musicToggle.setAttribute("aria-pressed", "true");
      musicToggle.textContent = "Desligar música";
    } catch (_) {
      musicToggle.setAttribute("aria-pressed", "false");
    }
  } else {
    bgMusic.pause();
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggle.textContent = "Ligar música";
  }
});

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let options = Array(9).fill("");
let currentPlayer = "X";
let currentSelection = 0;
let running = false;
let isCpu = false;
let cpuLevel = "easy";
let player1Scan = true;
let player2Scan = true;

function playSound() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

// ===== JOGO =====
function startGame() {
  options = Array(9).fill("");
  currentPlayer = "X";
  cells.forEach(cell => {
    cell.textContent = "";
    $(cell).prop("disabled", false);
    cell.classList.remove("winner");
  });
  gameContainer.hidden = false;
  currentSelection = 0;
  running = true;
  updateStatus();
  if (shouldCpuPlay()) {
    setTimeout(cpuMove, 500);
  }
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
  $(cell).prop("disabled", true);
  playSound();

  const win = checkWinner();
  if (win) {
    win.forEach(i => cells[i].classList.add("winner"));
    running = false;
    window.showGameOver(`Jogador ${currentPlayer} venceu!`);
    return;
  }

  if (!options.includes("")) {
    statusText.textContent = "Empate!";
    running = false;
    window.showGameOver("Empate!");
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus();
  if (shouldCpuPlay()) {
    setTimeout(cpuMove, 500);
  } else {
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

function updateStatus() {
  statusText.textContent = `Vez do jogador ${currentPlayer}`;
}

// A varredura do menu e dos controles de fim de jogo é gerenciada pelo núcleo comum.
window.GameModule = {
  start: function (settings) {
    const mode = settings.mode || "cpu";
    isCpu = mode === "cpu";
    cpuLevel = settings.difficulty || "easy";
    const humanSymbol = settings.symbol || "X";
    player1Scan = mode === "human-scan" || humanSymbol === "X";
    player2Scan = mode === "human-scan" || humanSymbol === "O";
    currentPlayer = isCpu || humanSymbol === "X" ? "X" : "O";
    startGame();
    window.GameCommon.startScan();
  },
  stop: function () { running = false; },
  usesCommonScan: function () { return !shouldCpuPlay(); }
};
$(".cell").off("click").on("click", function () {
  if (!running) return;
  currentSelection = Number($(this).data("index"));
  handleGameClick();
});
});
