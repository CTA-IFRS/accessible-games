$(document).ready(function () {
  const wordLists = {
    easy: ["CASA", "AMOR", "SOL", "LUA", "MAR"],
    medium: ["JARDIM", "ESCOLA", "PRAIA", "FLORESTA"],
    hard: ["ACESSIBILIDADE", "INCLUSAO", "RESPEITO", "DIVERSIDADE"]
  };

  const $menuContainer = $('#menuContainer');
  const $gameContainer = $('#game-container');
  const $canvas = $('#hangman-canvas');
  const ctx = $canvas[0].getContext('2d');
  const $wordDisplay = $('#word-display');
  const $keyboard = $('#keyboard');
  const $message = $('#message');
  const $backBtn = $('#back-btn');
  const $restartBtn = $('#restart-btn');
  const $buttonContainer = $('#button-container');
  const $startBtn = $('#start-btn');
  const $speedOptions = $('#speed-options .menu-option');
  const $difficultyOptions = $('#difficulty-options .menu-option');

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
      this.$currentFocusedElement = null;
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
      if (this.$currentFocusedElement) {
        this.$currentFocusedElement.removeClass('focused');
      }
      this.currentIndex = (this.currentIndex + 1) % this.elements.length;
      this.$currentFocusedElement = $(this.elements[this.currentIndex]);
      this.$currentFocusedElement.addClass('focused');
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

    $('#speed-section').show();
    $('#difficulty-section').hide();

    // When a speed is selected, show difficulty section
    $speedOptions.off('click.showDifficulty').on('click.showDifficulty', function () {
      $('#difficulty-section').show();
      $('#speed-section').hide();      
    });

    // When a difficulty is selected, show start button
    $difficultyOptions.off('click.showStart').on('click.showStart', function () {
      $('#difficulty-section').hide();
      $('#speed-section').hide(); 

      startGame();
    });


    /*
    $speedOptions.removeClass('selected');
    $difficultyOptions.removeClass('selected');

    autoFocus.setElements($speedOptions.toArray());
    autoFocus.start();

    // Speed options click
    $speedOptions.off('click').on('click', function () {
      $speedOptions.removeClass('selected');
      $(this).addClass('selected');
      focusSpeed = parseInt($(this).data('speed'));
      autoFocus.setSpeed(focusSpeed);

      // Switch focus to difficulty options
      autoFocus.setElements($difficultyOptions.toArray());
      autoFocus.start();
    });

    // Difficulty options click
    $difficultyOptions.off('click').on('click', function () {
      $difficultyOptions.removeClass('selected');
      $(this).addClass('selected');
      difficulty = $(this).data('difficulty');
      startGame();
    });

    $(document).off('click.menu').on('click.menu', function (e) {
      if (autoFocus.$currentFocusedElement &&
          !autoFocus.elements.includes(e.target)) {
        autoFocus.$currentFocusedElement.trigger('click');
      }
    });
    */
  }

  /* Settings Modal */
  const $settings = $(`
    <div class="menu-section settings-section">
      <button id="settingsBtn" class="settings-btn" title="Configurações">
        <span style="font-size:1.2em;">&#9881; Configurações</span>
      </button>

      <label id="autoScanLabel">
        <input type="checkbox" id="autoScanToggle" />
        Verredura Automática do Menu
      </label>
    </div>
  `);
  $("#menu").after($settings);

  const $settingsModal = $(`
    <div id="settingsModal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3>Gerenciar Palavras</h3>

        <div>
          <h4>Adicionar Palavra:</h4>
          <input type="text" id="newWordInput" placeholder="Digite uma palavra..." maxlength="20" style="width:80%;" />
          <button id="addWordBtn">Adicionar</button>
        </div>

        <div>
          <h4>Palavras Atuais:</h4>
          <ul id="wordsList"></ul>
        </div>

        <span class="close" style="float:right;cursor:pointer;">&times; Fechar</span>
      </div>
    </div>
  `);
  $("body").append($settingsModal);

  function startGame() {
    gameActive = true;
    $menuContainer.hide();
    $gameContainer.show();
    $buttonContainer.hide();

    words = wordLists[difficulty];
    selectedWord = words[Math.floor(Math.random() * words.length)];
    displayedWord = Array(selectedWord.length).fill('_');
    wrongGuesses = 0;

    ctx.clearRect(0, 0, $canvas[0].width, $canvas[0].height);
    drawHangmanBase();
    updateWordDisplay();
    $message.text('').removeClass();

    createKeyboard();
    autoFocus.setElements($('.key').toArray());
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
    $wordDisplay.text(displayedWord.join(' '));
  }

  function createKeyboard() {
    $keyboard.empty();
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      const $key = $('<button>')
        .addClass('key')
        .text(letter)
        .on('click', () => handleGuess(letter, $key));
      $keyboard.append($key);
    });
  }

  function handleGuess(letter, $keyElement) {
    if (!gameActive || $keyElement.prop('disabled')) return;
    $keyElement.prop('disabled', true);

    if (selectedWord.includes(letter)) {
      for (let i = 0; i < selectedWord.length; i++) {
        if (selectedWord[i] === letter) displayedWord[i] = letter;
      }
      $keyElement.addClass('correct');
      updateWordDisplay();
      if (!displayedWord.includes('_')) endGame(true);
    } else {
      wrongGuesses++;
      drawHangmanPart(wrongGuesses);
      $keyElement.addClass('wrong');
      if (wrongGuesses >= maxWrongGuesses) endGame(false);
    }
  }

  function endGame(win) {
    gameActive = false;
    autoFocus.stop();
    $message
      .text(win ? `Parabéns! Você venceu! A palavra era: ${selectedWord}`
                : `Fim de jogo! A palavra era: ${selectedWord}`)
      .attr('class', win ? 'message win' : 'message lose');
    $buttonContainer.css('display', 'flex');
    $('.key').prop('disabled', true);
    autoFocus.setElements([$restartBtn[0], $backBtn[0]]);
    autoFocus.start();
  }

  $backBtn.on('click', function () {
    gameActive = false;
    autoFocus.stop();
    $gameContainer.hide();
    $menuContainer.show();
    $buttonContainer.hide();
    initMenu();
  });

  $restartBtn.on('click', function () {
    startGame();
  });

  $(document).on('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (autoFocus.$currentFocusedElement) {
        autoFocus.$currentFocusedElement.trigger('click');
        e.preventDefault();
      }
    }
  });

  initMenu();
});
