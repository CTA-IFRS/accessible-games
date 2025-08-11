document.addEventListener('DOMContentLoaded', function() {
    // Palavras para o jogo
    const wordLists = {
      easy: ["CASA", "AMOR", "SOL", "LUA", "MAR"],
      medium: ["JARDIM", "ESCOLA", "PRAIA", "FLORESTA"],
      hard: ["ACESSIBILIDADE", "INCLUSAO", "RESPEITO", "DIVERSIDADE"]
    };
  
    // Elementos do DOM
    const menuContainer = document.getElementById('menuContainer');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('hangman-canvas');
    const ctx = canvas.getContext('2d');
    const wordDisplay = document.getElementById('word-display');
    const keyboardContainer = document.querySelector('.keyboard-container');
    const keyboard = document.getElementById('keyboard');
    const message = document.getElementById('message');
    const backBtn = document.getElementById('back-btn');
    const restartBtn = document.getElementById('restart-btn');
    const buttonContainer = document.getElementById('button-container');
    const startBtn = document.getElementById('start-btn');
    const speedOptions = document.querySelectorAll('#speed-options .menu-option');
    const difficultyOptions = document.querySelectorAll('#difficulty-options .menu-option');
  
    // Variáveis do jogo
    let words = [];
    let selectedWord = '';
    let displayedWord = [];
    let wrongGuesses = 0;
    const maxWrongGuesses = 6;
    let gameActive = false;
    let focusSpeed = 1000;
    let difficulty = "easy";
    let currentFocusedElement = null;
    let focusInterval;
    let currentFocusIndex = 0;
    
    // Sistema de varredura automática melhorado
    class AutoFocus {
      constructor(elements, speed) {
        this.elements = elements;
        this.speed = speed;
        this.currentIndex = 0;
        this.interval = null;
        this.sectionGroups = this.groupBySections();
      }
  
      groupBySections() {
        const groups = [];
        let currentSection = null;
        let currentGroup = [];
  
        this.elements.forEach(el => {
          const section = el.closest('.menu-section');
          if (section !== currentSection) {
            if (currentGroup.length > 0) groups.push(currentGroup);
            currentGroup = [];
            currentSection = section;
          }
          currentGroup.push(el);
        });
  
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
      }
  
      start() {
        this.stop();
        this.interval = setInterval(() => this.advanceFocus(), this.speed);
      }
  
      stop() {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
      }
  
      advanceFocus() {
        if (this.currentFocusedElement) {
          this.currentFocusedElement.classList.remove('focused');
        }
  
        // Encontra o próximo elemento não selecionado
        let attempts = 0;
        let nextIndex;
        
        do {
          nextIndex = (this.currentIndex + 1) % this.elements.length;
          this.currentIndex = nextIndex;
          attempts++;
        } while (
          attempts < this.elements.length && 
          this.elements[nextIndex].classList.contains('selected')
        );
  
        this.currentFocusedElement = this.elements[nextIndex];
        this.currentFocusedElement.classList.add('focused');
        this.currentFocusedElement.focus();
      }
  
      setElements(newElements) {
        this.elements = newElements;
        this.currentIndex = 0;
        this.sectionGroups = this.groupBySections();
      }
  
      setSpeed(newSpeed) {
        this.speed = newSpeed;
        if (this.interval) {
          this.start();
        }
      }
    }
  
    // Instância do sistema de foco automático
    const autoFocus = new AutoFocus([], focusSpeed);
  
    function initMenu() {
      // Resetar seleções
      speedOptions.forEach(opt => opt.classList.remove('selected'));
      difficultyOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Selecionar padrões
      document.querySelector('[data-speed="1000"]').classList.add('selected');
      document.querySelector('[data-difficulty="easy"]').classList.add('selected');
  
      // Event listeners para opções
      speedOptions.forEach(option => {
        option.addEventListener('click', function() {
          speedOptions.forEach(opt => opt.classList.remove('selected'));
          this.classList.add('selected');
          focusSpeed = parseInt(this.getAttribute('data-speed'));
          autoFocus.setSpeed(focusSpeed);
        });
      });
      
      difficultyOptions.forEach(option => {
        option.addEventListener('click', function() {
          difficultyOptions.forEach(opt => opt.classList.remove('selected'));
          this.classList.add('selected');
          difficulty = this.getAttribute('data-difficulty');
        });
      });
      
      startBtn.addEventListener('click', startGame);
      
      // Configura a varredura para o menu
      const menuFocusElements = [...speedOptions, ...difficultyOptions, startBtn];
      autoFocus.setElements(menuFocusElements);
      autoFocus.start();
      
      // Configura o clique em qualquer lugar para selecionar o item com foco
      document.addEventListener('click', function(e) {
        if (!menuFocusElements.includes(e.target) && autoFocus.currentFocusedElement) {
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
      message.className = 'message';
      
      createKeyboard();
      
      // Configura a varredura para o jogo (teclado)
      const keys = document.querySelectorAll('.key');
      autoFocus.setElements(Array.from(keys));
      autoFocus.start();
    }
    
    function drawHangmanBase() {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#333';
      
      ctx.beginPath();
      ctx.moveTo(20, 230);
      ctx.lineTo(100, 230);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(60, 230);
      ctx.lineTo(60, 30);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(60, 30);
      ctx.lineTo(160, 30);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(160, 30);
      ctx.lineTo(160, 60);
      ctx.stroke();
    }
    
    function drawHangmanPart(part) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#333';
      
      switch(part) {
        case 1: 
          ctx.beginPath();
          ctx.arc(160, 80, 20, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 2: 
          ctx.beginPath();
          ctx.moveTo(160, 100);
          ctx.lineTo(160, 160);
          ctx.stroke();
          break;
        case 3: 
          ctx.beginPath();
          ctx.moveTo(160, 120);
          ctx.lineTo(130, 140);
          ctx.stroke();
          break;
        case 4: 
          ctx.beginPath();
          ctx.moveTo(160, 120);
          ctx.lineTo(190, 140);
          ctx.stroke();
          break;
        case 5: 
          ctx.beginPath();
          ctx.moveTo(160, 160);
          ctx.lineTo(140, 200);
          ctx.stroke();
          break;
        case 6: 
          ctx.beginPath();
          ctx.moveTo(160, 160);
          ctx.lineTo(180, 200);
          ctx.stroke();
          break;
      }
    }
    
    function updateWordDisplay() {
      wordDisplay.textContent = displayedWord.join(' ');
    }
    
    function createKeyboard() {
      keyboard.innerHTML = '';
      
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      
      alphabet.forEach(letter => {
        const key = document.createElement('button');
        key.className = 'key';
        key.textContent = letter;
        key.setAttribute('data-letter', letter);
        key.addEventListener('click', () => handleGuess(letter, key));
        keyboard.appendChild(key);
      });
    }
    
    function handleGuess(letter, keyElement) {
      if (!gameActive || keyElement.disabled) return;
      
      keyElement.disabled = true;
      
      if (selectedWord.includes(letter)) {
        for (let i = 0; i < selectedWord.length; i++) {
          if (selectedWord[i] === letter) {
            displayedWord[i] = letter;
          }
        }
        
        keyElement.classList.add('correct');
        updateWordDisplay();
        
        if (!displayedWord.includes('_')) {
          endGame(true);
        }
      } else {
        wrongGuesses++;
        drawHangmanPart(wrongGuesses);
        keyElement.classList.add('wrong');
        
        if (wrongGuesses >= maxWrongGuesses) {
          endGame(false);
        }
      }
    }
    
    function endGame(win) {
      gameActive = false;
      autoFocus.stop();
      
      if (win) {
        message.textContent = 'Parabéns! Você venceu! A palavra era: ' + selectedWord;
        message.classList.add('win');
      } else {
        message.textContent = 'Fim de jogo! A palavra era: ' + selectedWord;
        message.classList.add('lose');
      }
      
      buttonContainer.style.display = 'flex';
      
      document.querySelectorAll('.key').forEach(key => {
        key.disabled = true;
      });
      
      // Configura a varredura para os botões de fim de jogo
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
  
    // Evento para tecla Space/Enter
    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (autoFocus.currentFocusedElement) {
          autoFocus.currentFocusedElement.click();
          e.preventDefault();
        }
      }
    });
  
    // Inicia o jogo
    initMenu();
  });