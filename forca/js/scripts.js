$(document).ready(function () {
  const wordLists = {
    easy: ["CASA", "AMOR", "SOL", "LUA", "MAR"],
    medium: ["JARDIM", "ESCOLA", "PRAIA", "FLORESTA"],
    hard: ["ACESSIBILIDADE", "INCLUSAO", "RESPEITO", "DIVERSIDADE"]
  };

  const $menuContainer = $('#menuContainer');
  const $gameContainer = $('#gameContainer');
  const $canvas = $('#hangman-canvas');
  const ctx = $canvas[0].getContext('2d');
  const $wordDisplay = $('#word-display');
  const $keyboard = $('#keyboard');

  let $menuOptions = $(".menu-option[data-option]");
  let allOptions = $menuOptions.toArray();
  let currentSelection = 0;
  let scanSpeed = 800;
  let scanInterval = null;
  let difficulty = 'easy';

  /* Menu navigation scan */
  function startMenuScan(startIndex = 0) 
  {
    let index = startIndex;
    
    stopMenuScan();
    
    scanInterval = setInterval(() => {
      $(allOptions).blur();
      $(allOptions[index]).focus();
      currentSelection = index;
      index = (index + 1) % allOptions.length;
    }, scanSpeed);

    $(document).on("keydown.initGame", function (e) 
    {
      if (e.code === "Space" || e.code === "Enter") 
      {
        initGame();
      }
    });
  }

  function stopMenuScan() 
  {
    if (scanInterval) clearInterval(scanInterval);
    $(document).off(".initGame");
  }

  function initGame() 
  {
    const selected = $(allOptions[currentSelection]);

    if (selected.data("option")) 
    {
      difficulty = selected.data("option");

      $menuContainer.hide();
      
      stopMenuScan();
      startGame();
    }
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
  $(".menu-section").after($settings);

  const $settingsModal = $(`
    <div id="settingsModal" class="modal" style="display:none;">
      <div class="modal-content">
        <h3>Configurações</h3>
        <div>
          <h4>Gerenciar Palavras</h4>

          <div>
            <h5>Adicionar Palavra:</h5>
            <input type="text" id="newWordInput" placeholder="Digite uma palavra..." maxlength="20" style="width:95%;" />
            <input type="text" id="newURLWordInput" placeholder="Digite a URL da palavra..." style="width:95%;" />
            <select id="difficultySelect" style="width:80%;">
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
            <button id="addWordBtn">Adicionar</button>
          </div>

          <div>
            <h5>Palavras Atuais:</h5>
            <ul id="wordsList"></ul>
          </div>
        </div>

        <div>
          <h4>Velocidade de Verredura:</h4>

          <select id="scanSpeedSelect">
            <option value="slow">Lenta</option>
            <option value="medium" selected>Média</option>
            <option value="fast">Rápida</option>
          </select>
        </div>

        <span class="close" style="float:right;cursor:pointer;">&times; Fechar</span>
      </div>  
    </div>
  `);
  $("body").append($settingsModal);

  $("#scanSpeedSelect").on("change", function () {
    const selectedSpeed = $(this).val();
    scanSpeed = selectedSpeed === "slow" ? 2000 :
                selectedSpeed === "medium" ? 1000 : 500;
  });

  $("#autoScanToggle").on("change", function () {
    if (this.checked) {
      $menuOptions.attr("tabindex", "-1").off("click.initGame");
      startMenuScan();
    } else {
      stopMenuScan();
      $menuOptions.attr("tabindex", "0").on("click.initGame", function () {
        currentSelection = allOptions.indexOf(this);
        initGame();
      });
      $menuOptions.blur();
    }
  });

  stopMenuScan();
  $menuOptions.attr("tabindex", "0").on("click.initGame", function () {
    currentSelection = allOptions.indexOf(this);
    initGame();
  });

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

  let palavras = getSavedWords();
  if (!palavras.length) 
  {
    //saveWords(wordLists.hard);
  }

  $("#settingsBtn").on("click", () => {
    stopMenuScan();
    updateWordsList();

    $settingsModal.show();

    $("#newWordInput").val("").focus();
  });

  $settingsModal.find(".close").on("click", () => {
    $settingsModal.hide()
    
    if ($("#autoScanToggle").is(":checked"))
      startMenuScan();
  });

  $(window).on("click", (e) => {
    if ($(e.target).is("#settingsModal")) $settingsModal.hide();
  });

  // Add word
  $("#addWordBtn").on("click", function () 
  {
    const word = $("#newWordInput").val().trim().toUpperCase();
    const url = $("#newURLWordInput").val().trim();
    const difficulty = $("#difficultySelect").val();

    if (word && !palavras.some(w => w.word === word)) 
    {
      palavras.push({ word, url, difficulty });

      saveWords(palavras);
      updateWordsList();

      $("#newWordInput").val("").focus();
      $("#newURLWordInput").val("");
    }
  });

  function updateWordsList() 
  {
    const $list = $("#wordsList");
    $list.empty();

    console.log(palavras);

    const difficulties = { easy: [], medium: [], hard: [] };
    
    palavras.forEach((w) => {
      const difficulty = w.difficulty || 'easy';
      difficulties[difficulty].push(w);
    });

    Object.entries(difficulties).forEach(([difficulty, words]) =>
    {
      if (words.length > 0)
      {
        const $category = $(`<li><strong>${difficulty.toUpperCase()}</strong><ul class="words-by-difficulty"></ul></li>`);
        const $subList = $category.find('.words-by-difficulty');

        words.forEach((w, i) => {
          const imgHtml = w.url ? `<img src="${w.url}" alt="${w.word}" style="max-width:50px;max-height:50px;margin-right:10px;">` : '';
          const $wordLi = $(`<li>${imgHtml}<span>${w.word}</span> <button data-word="${w.word}" class="removeButton">Remover</button></li>`);

          $wordLi.find("button").on("click", function () {
            palavras = palavras.filter(item => item.word !== $(this).data("word"));
            saveWords(palavras);
            updateWordsList();
          });

          $subList.append($wordLi);
        });

        $list.append($category);
      }
    });
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

    $menuContainer.hide();
    $gameContainer.show();

    words = getSavedWords().filter(w => w.difficulty === difficulty).map(w => w.word);

    if (words.length === 0) {
      palavras = getSavedWords().filter(w => w.difficulty === difficulty).map(w => w.word);
    }
    selectedWord = words[Math.floor(Math.random() * words.length)];
    words = words.filter(word => word !== selectedWord); // Remove the selected word from the array
    displayedWord = Array(selectedWord.length).fill('_');
    wrongGuesses = 0;

    const $wordImage = $('#word-image');

    // Update the word display and image
    const wordData = palavras.find(w => w.word === selectedWord);
    if (wordData && wordData.url) {
      $wordImage.html(`<img src="${wordData.url}" alt="${wordData.word}" style="max-width:50px;max-height:50px;">`);
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

    $menuOptions = $(".key");
    allOptions = $menuOptions.toArray();

    $menuOptions.on("keydown", function (e) 
    {
      if (e.code === "Space" || e.code === "Enter") 
      {
        handleGuess($(this).text(), $(this));
      }
    });

    $menuOptions.on("click", function () 
    {
      handleGuess($(this).text(), $(this));
    });

    if ($("#autoScanToggle").is(":checked"))
      startMenuScan();
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
    if (!win)
    {
      mostrarMenuGameOver();
    }
    else
    {
      startGame();
    }
  }

  function falarTexto(texto) 
  {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.volume = 1.0;
    utterance.lang = "pt-BR";

    speechSynthesis.speak(utterance);
  }

  /* game over menu */
  function mostrarMenuGameOver() 
  {
    gameActive = false;

    const $overlay = $(`
      <div id="gameOverMenu">
        <div class="game-over-content">
          <h3>Game Over</h3>
          <button id="retry" class="game-over-option" data-action="restart" tabindex="0">Reiniciar Jogo</button>
          <button id="menu" class="game-over-option" data-action="menu" tabindex="0">Voltar ao Menu</button>
        </div>
      </div>
    `);

    $("body").append($overlay);

    $menuOptions = $("#retry, #menu");
    allOptions = $menuOptions.toArray();

    $menuOptions.on("keydown", function (e) 
    {
      if (e.code === "Space" || e.code === "Enter") 
      {
        executarAcao($(this).data("action"));
      }
    });

    $menuOptions.on("click", function () 
    {
      executarAcao($(this).data("action"));
    });

    if ($("#autoScanToggle").is(":checked"))
      startMenuScan();
  }

  function executarAcao(action) 
  {
    if (action === "restart") 
    {
      $("#gameOverMenu").remove();

      startGame();
    } 
    else if (action === "menu") 
    {
      window.location.href = "index.html";
    }
  }
});