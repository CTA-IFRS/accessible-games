$(document).ready(function () {
  const $menuContainer = $('#menuContainer');
  const $gameContainer = $('#gameContainer');
  const $hitZone = $('#hitZone');
  const $scoreSpan = $('#points');
  const $typedSpan = $('#typedWord');

  let $menuOptions = $(".menu-option[data-option]");
  let allOptions = $menuOptions.toArray();
  let currentSelection = 0;
  let scanSpeed = 800;
  let scanInterval = null;
  let velocidadeSelecionada = "medium";

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
      const opt = selected.data("option");

      velocidadeSelecionada = opt.replace("speed-", "");
      scanSpeed =
        velocidadeSelecionada === "slow" ? 2000 :
        velocidadeSelecionada === "medium" ? 1000 : 500;

      $menuContainer.hide();
      
      stopMenuScan();
      novaRodada();
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
    const saved = localStorage.getItem("palavras");

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
    localStorage.setItem("palavras", JSON.stringify(words));
  }

  let palavras = getSavedWords();
  if (!palavras.length) 
  {
    palavras = ["IFRS", "ACESSIBILIDADE", "CTA"];

    saveWords(palavras);
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

    if (word && !palavras.includes(word)) 
    {
      palavras.push(word);

      saveWords(palavras);
      updateWordsList();

      $("#newWordInput").val("").focus();
    }
  });

  function updateWordsList() 
  {
    const $list = $("#wordsList");
    $list.empty();

    palavras.forEach((w, i) => 
    {
      const $li = $(`<li>${w} <button data-i="${i}" class="removeButton" >Remover</button></li>`);

      $li.find("button").on("click", function () 
      {
        palavras.splice($(this).data("i"), 1);
        saveWords(palavras);
        updateWordsList();
      });
      
      $list.append($li);
    });
  }

  /* Game Logic */
  let palavraAtual = "";
  let indexLetra = 0;
  let pontos = 0;
  let letraAtual = null;
  let animacaoAtual = null;
  let vidas = 3;
  let velocidade = 1;
  const maxVidas = 3;
  let proximoTimeout = null;
  let jogoAtivo = false;

  const somAcerto = new Audio("assets/sounds/somAcerto.mp3");
  somAcerto.volume = 0.1;
  const somErro = new Audio("assets/sounds/somErro.mp3");
  somErro.volume = 0.1;

  // input flags
  let keyPressed = false;
  let mousePressed = false;

  function falarTexto(texto) 
  {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.volume = 1.0;
    utterance.lang = "pt-BR";

    speechSynthesis.speak(utterance);
  }

  // limpa tudo que pode causar execução dupla
  function limparEstado() 
  {
    if (animacaoAtual) 
    {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }

    if (proximoTimeout) 
    {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }

    if (letraAtual) 
    {
      $(letraAtual).remove();
      letraAtual = null;
    }

    $gameContainer.find(".letter").remove();
  }

  function novaRodada() 
  {
    // cancela qualquer timeout anterior
    if (proximoTimeout) 
    {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }

    limparEstado();

    switch (velocidadeSelecionada) 
    {
      case "slow": velocidade = 1; break;
      case "medium": velocidade = 3; break;
      case "fast": velocidade = 5; break;
      default: velocidade = 1;
    }

    $gameContainer.show();
    jogoAtivo = true;
    $scoreSpan.text(pontos);
    vidas = maxVidas;
    indexLetra = 0;
    $typedSpan.html("");
    palavraAtual = palavras[Math.floor(Math.random() * palavras.length)];
    atualizarVidas();

    // reset input-lock flags (evita herdar estado de pressionamento)
    keyPressed = false;
    mousePressed = false;

    iniciarLetra();
  }

  function criarLetra(letra) 
  {
    const $div = $("<div>")
      .addClass("letter")
      .text(letra)
      .attr("data-letra", letra)
      .css("top", "0px");

    $gameContainer.append($div);

    return $div;
  }

  function animarLetra($letraEl) 
  {
    let top = 0;

    if (animacaoAtual) 
    {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }

    animacaoAtual = setInterval(() => 
    {
      if (!jogoAtivo) 
      {
        clearInterval(animacaoAtual);

        animacaoAtual = null;
        $letraEl.remove();

        return;
      }

      top += velocidade;
      $letraEl.css("top", top + "px");

      if (top > $gameContainer.height()) 
      {
        clearInterval(animacaoAtual);
        animacaoAtual = null;
        $letraEl.remove();

        if (!jogoAtivo) return;

        mostrarLetra(false, $letraEl.data("letra"));
        perderVidas();
        somErro.play();
        letraAtual = null;
        indexLetra++;

        if (jogoAtivo) 
        {
          proximoTimeout = setTimeout(() => iniciarLetra(), 500);
        }
      }
    }, 16);
  }

  function iniciarLetra() 
  {
    if (!jogoAtivo) return;

    if (proximoTimeout) 
    {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }

    if (animacaoAtual) 
    {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }

    if (letraAtual) 
    {
      $(letraAtual).remove();
      letraAtual = null;
    }

    if (indexLetra >= palavraAtual.length) 
    {
      falarTexto(palavraAtual);

      proximoTimeout = setTimeout(() => 
      {
        if (jogoAtivo) novaRodada();
      }, 2000);

      return;
    }

    const letra = palavraAtual[indexLetra];
    const $letraEl = criarLetra(letra);
    letraAtual = $letraEl;

    falarTexto(letra);
    animarLetra($letraEl);
  }

  function mostrarLetra(acertou, letra = "") 
  {
    const $span = $("<span>")
      .text(letra.toUpperCase())
      .addClass(acertou ? "correct" : "wrong");

    $typedSpan.append($span);
  }

  function atualizarVidas() 
  {
    const coracao = "❤️";

    $("#vidas").text(coracao.repeat(vidas));
  }

  function perderVidas() 
  {
    vidas--;

    atualizarVidas();

    if (vidas <= 0) 
    {
      mostrarMenuGameOver();
    }
  }

  $(document).on("keydown.game", function (e) 
  {
    // Proteções
    if (!jogoAtivo) return;            // só processa durante o jogo
    if (keyPressed) return;            // evita repetição por tecla segurada

    const letraDigitada = (e.key || "").toLowerCase();
    if (!/^[a-z]$/.test(letraDigitada)) return;

    keyPressed = true; // bloqueia até keyup

    if (!letraAtual) 
    {
      // se não há letra atual, libera a flag para não travar
      keyPressed = false;
      return;
    }

    const letraCerta = $(letraAtual).data("letra").toLowerCase();
    const letraTop = $(letraAtual).position().top;
    const letraBottom = letraTop + $(letraAtual).outerHeight();
    const hitTop = $hitZone.position().top;
    const hitBottom = hitTop + $hitZone.outerHeight();
    const dentroZona = letraBottom > hitTop && letraTop < hitBottom;

    if (dentroZona && letraDigitada === letraCerta) 
    {
      pontos += 10;
      somAcerto.play();
      $scoreSpan.text(pontos);

      mostrarLetra(true, letraDigitada);
    } 
    else
    {
      if (pontos > 5)
        pontos -= 5;

      $scoreSpan.text(pontos);
      somErro.play();

      perderVidas();
      mostrarLetra(false, letraDigitada);
    }

    // interrompe animação e prepara próxima letra de forma única
    if (animacaoAtual) 
    {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }

    if (letraAtual) 
    {
      $(letraAtual).remove();
      letraAtual = null;
    }

    indexLetra++;
    iniciarLetra();
  });

  $(document).on("keyup.game", function () 
  {
    keyPressed = false;
  });

  /* game over menu */
  function mostrarMenuGameOver() 
  {
    $(document).off(".game");

    jogoAtivo = false;

    // limpa intervals/timeouts e letras na tela
    limparEstado();

    // zera flags para evitar input preso
    keyPressed = false;
    mousePressed = false;

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

      pontos = 0;
      $scoreSpan.text(pontos);

      novaRodada();
    } 
    else if (action === "menu") 
    {
      window.location.href = "index.html";
    }
  }
});
