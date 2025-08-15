document.addEventListener('DOMContentLoaded', function() {
  const wordLists = {
    easy: ["CASA", "AMOR", "SOL", "LUA", "MAR"],
    medium: ["JARDIM", "ESCOLA", "PRAIA", "FLORESTA"],
    hard: ["ACESSIBILIDADE", "INCLUSAO", "RESPEITO", "DIVERSIDADE"]
  };

  const menuContainer = document.getElementById('menuContainer');
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('hangman-canvas');
  const ctx = canvas.getContext('2d');
  const wordDisplay = document.getElementById('word-display');
  const keyboard = document.getElementById('keyboard');
  const message = document.getElementById('message');
  const backBtn = document.getElementById('back-btn');
  const restartBtn = document.getElementById('restart-btn');
  const buttonContainer = document.getElementById('button-container');
  const startBtn = document.getElementById('start-btn');
  const speedOptions = document.querySelectorAll('#speed-options .menu-option');
  const difficultyOptions = document.querySelectorAll('#difficulty-options .menu-option');

  let words = [];
  let selectedWord = '';
  let displayedWord = [];
  let wrongGuesses = 0;
  const maxWrongGuesses = 6;
  let gameActive = false;
  let focusSpeed = 1000;
  let difficulty = "easy";

  class AutoFocus {
    constructor(elements, speed) {
      this.elements = elements;
      this.speed = speed;
      this.currentIndex = -1;
      this.interval = null;
      this.currentFocusedElement = null;
    }
    start() {
      this.stop();
      this.interval = setInterval(() => this.advanceFocus(), this.speed);
    }
    stop() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    }
    advanceFocus() {
      if (this.currentFocusedElement) {
        this.currentFocusedElement.classList.remove('focused');
      }
      this.currentIndex = (this.currentIndex + 1) % this.elements.length;
      this.currentFocusedElement = this.elements[this.currentIndex];
      this.currentFocusedElement.classList.add('focused');
    }
    setElements(newElements) {
      this.elements = newElements;
      this.currentIndex = -1;
    }
    setSpeed(newSpeed) {
      this.speed = newSpeed;
      if (this.interval) this.start();
    }
  }

  const autoFocus = new AutoFocus([], focusSpeed);

  function initMenu() {
    // Remove seleções
    speedOptions.forEach(opt => opt.classList.remove('selected'));
    difficultyOptions.forEach(opt => opt.classList.remove('selected'));

    // Começa varredura apenas na velocidade
    autoFocus.setElements([...speedOptions]);
    autoFocus.start();

    // Ao clicar na velocidade → muda para dificuldade
    speedOptions.forEach(option => {
      option.addEventListener('click', function () {
        speedOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        focusSpeed = parseInt(this.getAttribute('data-speed'));
        autoFocus.setSpeed(focusSpeed);

        // Agora varre apenas dificuldade
        autoFocus.setElements([...difficultyOptions]);
        autoFocus.start();
      });
    });

    // Ao clicar na dificuldade → inicia jogo
    difficultyOptions.forEach(option => {
      option.addEventListener('click', function () {
        difficultyOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        difficulty = this.getAttribute('data-difficulty');
        startGame();
      });
    });

    document.addEventListener('click', function (e) {
      if (autoFocus.currentFocusedElement && !autoFocus.elements.includes(e.target)) {
        autoFocus.currentFocusedElement.click();
      }
    });
  }

  function startGame() {
    gameActive = true;
    menuContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    buttonContainer.style.display = 'none';

    words = wordLists[difficulty];
    selectedWord = words[Math.floor(Math.random() * words.length)];
    displayedWord = Array(selectedWord.length).fill('_');
    wrongGuesses = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHangmanBase();
    updateWordDisplay();
    message.textContent = '';

    createKeyboard();
    autoFocus.setElements([...document.querySelectorAll('.key')]);
    autoFocus.start();
  }

  function drawHangmanBase() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(20, 230); ctx.lineTo(100, 230); ctx.stroke();
    ctx.moveTo(60, 230); ctx.lineTo(60, 30); ctx.stroke();
    ctx.moveTo(60, 30); ctx.lineTo(160, 30); ctx.stroke();
    ctx.moveTo(160, 30); ctx.lineTo(160, 60); ctx.stroke();
  }

  function drawHangmanPart(part) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#333';
    switch (part) {
      case 1: ctx.beginPath(); ctx.arc(160, 80, 20, 0, Math.PI * 2); ctx.stroke(); break;
      case 2: ctx.beginPath(); ctx.moveTo(160, 100); ctx.lineTo(160, 160); ctx.stroke(); break;
      case 3: ctx.beginPath(); ctx.moveTo(160, 120); ctx.lineTo(130, 140); ctx.stroke(); break;
      case 4: ctx.beginPath(); ctx.moveTo(160, 120); ctx.lineTo(190, 140); ctx.stroke(); break;
      case 5: ctx.beginPath(); ctx.moveTo(160, 160); ctx.lineTo(140, 200); ctx.stroke(); break;
      case 6: ctx.beginPath(); ctx.moveTo(160, 160); ctx.lineTo(180, 200); ctx.stroke(); break;
    }
  }

  function updateWordDisplay() {
    wordDisplay.textContent = displayedWord.join(' ');
  }

  function createKeyboard() {
    keyboard.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      const key = document.createElement('button');
      key.className = 'key';
      key.textContent = letter;
      key.addEventListener('click', () => handleGuess(letter, key));
      keyboard.appendChild(key);
    });
  }

  function handleGuess(letter, keyElement) {
    if (!gameActive || keyElement.disabled) return;
    keyElement.disabled = true;
    if (selectedWord.includes(letter)) {
      for (let i = 0; i < selectedWord.length; i++) {
        if (selectedWord[i] === letter) displayedWord[i] = letter;
      }
      keyElement.classList.add('correct');
      updateWordDisplay();
      if (!displayedWord.includes('_')) endGame(true);
    } else {
      wrongGuesses++;
      drawHangmanPart(wrongGuesses);
      keyElement.classList.add('wrong');
      if (wrongGuesses >= maxWrongGuesses) endGame(false);
    }
  }

  function endGame(win) {
    gameActive = false;
    autoFocus.stop();
    message.textContent = win ? 'Parabéns! Você venceu! A palavra era: ' + selectedWord
                              : 'Fim de jogo! A palavra era: ' + selectedWord;
    message.className = win ? 'message win' : 'message lose';
    buttonContainer.style.display = 'flex';
    document.querySelectorAll('.key').forEach(k => k.disabled = true);
    autoFocus.setElements([restartBtn, backBtn]);
    autoFocus.start();
  }

  backBtn.addEventListener('click', function() {
    gameActive = false;
    autoFocus.stop();
    gameContainer.style.display = 'none';
    menuContainer.style.display = 'block';
    buttonContainer.style.display = 'none';
    initMenu();
  });

  restartBtn.addEventListener('click', function() {
    startGame();
  });

  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (autoFocus.currentFocusedElement) {
        autoFocus.currentFocusedElement.click();
        e.preventDefault();
      }
    }
  });

  initMenu();
});
