$(document).ready(function () {
  const wordLists = {
    easy: ["CASA", "AMOR", "SOL", "LUA", "MAR"],
    medium: ["JARDIM", "ESCOLA", "PRAIA", "FLORESTA"],
    hard: ["ACESSIBILIDADE", "INCLUSAO", "RESPEITO", "DIVERSIDADE"]
  };

  const $gameContainer = $('#hangmanGame');
  const $canvas = $('#hangman-canvas');
  const ctx = $canvas[0].getContext('2d');
  const $wordDisplay = $('#word-display');
  const $keyboard = $('#keyboard');

  let difficulty = 'easy';
  let category = 'Geral';

  // Local Storage helpers
  function getSavedWords() 
  {
    const saved = localStorage.getItem("palavrasForca");

    try 
    {
      return saved ? JSON.parse(saved) : [];
    } 
    catch
    {
      return [];
    }
  }

  function saveWords(words) 
  {
    localStorage.setItem("palavrasForca", JSON.stringify(words));
  }

  /* Game Logic */
  let words = [];
  let selectedWord = '';
  let displayedWord = [];
  let wrongGuesses = 0;
  const maxWrongGuesses = 6;
  let gameActive = false;
  
  const somAcerto = new Audio("assets/sounds/somAcerto.mp3");
  somAcerto.volume = 0.1;
  
  const somErro = new Audio("assets/sounds/somErro.mp3");
  somErro.volume = 0.1;

  const somCorreto = new Audio("assets/sounds/somCorreto.mp3");
  somCorreto.volume = 0.4;

  function startGame()
  {
    gameActive = true;

    $gameContainer.prop('hidden', false);

    const savedWords = getSavedWords();
    words = savedWords.filter(w => (w.category || 'Geral') === category && w.difficulty === difficulty).map(w => w.word);
    if (!words.length && savedWords.some(w => (w.category || 'Geral') === category)) {
      gameActive = false;
      window.showGameOver(`A categoria ${category} não possui palavras de dificuldade ${difficulty}.`);
      return;
    }
    if (!words.length) words = (wordLists[difficulty] || wordLists.easy).slice();
    selectedWord = words[Math.floor(Math.random() * words.length)];
    displayedWord = Array(selectedWord.length).fill('_');
    wrongGuesses = 0;

    const $wordImage = $('#word-image');

    // Update the word display and image
    const wordData = savedWords.find(w => w.word === selectedWord && (w.category || 'Geral') === category);
    if (wordData && wordData.url) {
      const iconUrl = /^(https?:)?\/\//i.test(wordData.url) || wordData.url.startsWith('/')
        ? wordData.url : '../../' + wordData.url.replace(/^\.\//, '');
      $wordImage.empty().append($('<img>').attr({ src: iconUrl, alt: wordData.word }));
    } else {
      $wordImage.empty(); // Clear the image if there is no URL
    }

    ctx.clearRect(0, 0, $canvas[0].width, $canvas[0].height);

    drawHangmanBase();
    updateWordDisplay();
    createKeyboard();
  }

  function drawHangmanBase()
  {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#333';

    ctx.beginPath();
    ctx.moveTo(20, 230); ctx.lineTo(100, 230); ctx.stroke();
    ctx.moveTo(60, 230); ctx.lineTo(60, 30); ctx.stroke();
    ctx.moveTo(60, 30); ctx.lineTo(160, 30); ctx.stroke();
    ctx.moveTo(160, 30); ctx.lineTo(160, 60); ctx.stroke();
  }

  function drawHangmanPart(part)
  {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#333';

    switch (part)
    {
      case 1: ctx.beginPath(); ctx.arc(160, 80, 20, 0, Math.PI * 2); ctx.stroke(); break;
      case 2: ctx.beginPath(); ctx.moveTo(160, 100); ctx.lineTo(160, 160); ctx.stroke(); break;
      case 3: ctx.beginPath(); ctx.moveTo(160, 120); ctx.lineTo(130, 140); ctx.stroke(); break;
      case 4: ctx.beginPath(); ctx.moveTo(160, 120); ctx.lineTo(190, 140); ctx.stroke(); break;
      case 5: ctx.beginPath(); ctx.moveTo(160, 160); ctx.lineTo(140, 200); ctx.stroke(); break;
      case 6: ctx.beginPath(); ctx.moveTo(160, 160); ctx.lineTo(180, 200); ctx.stroke(); break;
    }
  }

  function updateWordDisplay()
  {
    $wordDisplay.text(displayedWord.join(' '));
  }

  function createKeyboard()
  {
    $keyboard.empty();

    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      const $key = $('<button>')
        .addClass('key')
        .text(letter)
        .on('click', () => handleGuess(letter, $key));
      $keyboard.append($key);
    });

    $keyboard.find(".key").attr("tabindex", 0);
  }

  function handleGuess(letter, $keyElement)
  {
    if (!gameActive || $keyElement.prop('disabled')) return;
    $keyElement.prop('disabled', true);

    falarTexto(letter)

    if (selectedWord.includes(letter))
    {
      for (let i = 0; i < selectedWord.length; i++)
      {
        if (selectedWord[i] === letter) displayedWord[i] = letter;
      }

      $keyElement.addClass('correct');
      somAcerto.play();

      updateWordDisplay();

      if (!displayedWord.includes('_'))
      {
        somCorreto.play();
        falarTexto(selectedWord);
        endGame(true);
      }
    }
    else
    {
      wrongGuesses++;

      drawHangmanPart(wrongGuesses);

      $keyElement.addClass('wrong');
      somErro.play();

      if (wrongGuesses >= maxWrongGuesses) endGame(false);
    }
  }

  function endGame(win)
  {
    gameActive = false;
    if (win) {
      somCorreto.play();
      falarTexto(selectedWord);
    }
    window.showGameOver(win ? `Você venceu! A palavra era ${selectedWord}.` : `A palavra era ${selectedWord}.`);
  }

  function falarTexto(texto) 
  {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.volume = 1.0;
    utterance.lang = "pt-BR";

    speechSynthesis.speak(utterance);
  }

  /* game over menu */
  window.GameModule = {
    start: function (settings) {
      difficulty = settings.difficulty || "easy";
      category = settings.category || "Geral";
      $("#gameOverMenu").hide();
      startGame();
    },
    stop: function () { gameActive = false; },
    usesCommonScan: function () { return true; }
  };
});
