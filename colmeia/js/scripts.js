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

  function startMenuScan(startIndex = 0) {
    let index = startIndex;
    stopMenuScan();
    scanInterval = setInterval(() => {
      $(allOptions).blur();
      $(allOptions[index]).focus();
      currentSelection = index;
      index = (index + 1) % allOptions.length;
    }, scanSpeed);
  }
  function stopMenuScan() {
    if (scanInterval) clearInterval(scanInterval);
  }

  function initGame() {
    const selected = $(allOptions[currentSelection]);
    if (selected.data("option")) {
      const opt = selected.data("option");
      velocidadeSelecionada = opt.replace("speed-", "");
      scanSpeed =
        velocidadeSelecionada === "slow" ? 2000 :
        velocidadeSelecionada === "medium" ? 1000 : 500;
      stopMenuScan();
      $menuContainer.hide();
      $(document).off(".initGame");
      novaRodada();
    }
  }

  $(document).on("keydown.initGame", function (e) {
    if (e.code === "Space" || e.code === "Enter") {
      initGame();
    }
  });
  $(document).on("click.initGame", function () {
    initGame();
  });

  startMenuScan();

  // ---------------------------------------------------------
  // game state
  const palavras = ["LIVRO", "ACESSIBILIDADE", "CADEIRA", "GATO"];
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

  function falarTexto(texto) {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.volume = 1.0;
    utterance.lang = "pt-BR";
    speechSynthesis.speak(utterance);
  }

  // limpa tudo que pode causar execução dupla
  function limparEstado() {
    if (animacaoAtual) {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }
    if (proximoTimeout) {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }
    if (letraAtual) {
      $(letraAtual).remove();
      letraAtual = null;
    }
    $gameContainer.find(".letter").remove();
  }

  function novaRodada() {
    // cancela qualquer timeout anterior
    if (proximoTimeout) {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }
    limparEstado();

    switch (velocidadeSelecionada) {
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

  function criarLetra(letra) {
    const $div = $("<div>")
      .addClass("letter")
      .text(letra)
      .attr("data-letra", letra)
      .css("top", "0px");
    $gameContainer.append($div);
    return $div;
  }

  function animarLetra($letraEl) {
    let top = 0;
    // garante que qualquer animação anterior foi limpa
    if (animacaoAtual) {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }

    animacaoAtual = setInterval(() => {
      if (!jogoAtivo) {
        clearInterval(animacaoAtual);
        animacaoAtual = null;
        $letraEl.remove();
        return;
      }

      top += velocidade;
      $letraEl.css("top", top + "px");

      if (top > $gameContainer.height()) {
        clearInterval(animacaoAtual);
        animacaoAtual = null;
        $letraEl.remove();

        if (!jogoAtivo) return;

        mostrarLetra(false, $letraEl.data("letra"));
        perderVidas();
        somErro.play();
        letraAtual = null;
        indexLetra++;

        if (jogoAtivo) {
          // agenda a próxima letra (controlado por proximoTimeout)
          proximoTimeout = setTimeout(() => iniciarLetra(), 500);
        }
      }
    }, 16);
  }

  function iniciarLetra() {
    if (!jogoAtivo) return;

    // evita timeouts antigos dispararem paralelo
    if (proximoTimeout) {
      clearTimeout(proximoTimeout);
      proximoTimeout = null;
    }

    // garante que não exista letra/intervalo pendente
    if (animacaoAtual) {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }
    if (letraAtual) {
      $(letraAtual).remove();
      letraAtual = null;
    }

    if (indexLetra >= palavraAtual.length) {
      falarTexto(palavraAtual);
      // armazena timeout para podermos cancelar se o jogador errar durante o delay
      proximoTimeout = setTimeout(() => {
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

  function mostrarLetra(acertou, letra = "") {
    const $span = $("<span>")
      .text(letra.toUpperCase())
      .addClass(acertou ? "correct" : "wrong");
    $typedSpan.append($span);
  }

  function atualizarVidas() {
    const coracao = "❤️";
    $("#vidas").text(coracao.repeat(vidas));
  }

  function perderVidas() {
    vidas--;
    atualizarVidas();
    if (vidas <= 0) {
      mostrarMenuGameOver();
    }
  }

  function mostrarMenuGameOver() {
    jogoAtivo = false;

    // limpa intervals/timeouts e letras na tela
    limparEstado();

    // zera flags para evitar input preso
    keyPressed = false;
    mousePressed = false;

    const $overlay = $(`
      <div id="gameOverMenu">
        <div class="game-over-content">
          <h2>Game Over</h2>
          <div id="retry" class="game-over-option" data-action="restart" tabindex="0">Reiniciar Jogo</div>
          <div id="menu" class="game-over-option" data-action="menu" tabindex="0">Voltar ao Menu</div>
        </div>
      </div>
    `);

    $("body").append($overlay);

    $menuOptions = $("#retry, #menu");
    allOptions = $menuOptions.toArray();

    $menuOptions.on("click", function () {
      executarAcao($(this).data("action"));
    });

    startMenuScan();
  }

  function executarAcao(action) {
    if (action === "restart") {
      $("#gameOverMenu").remove();
      pontos = 0;
      novaRodada();
    } else if (action === "menu") {
      window.location.href = "index.html";
    }
  }

  // ---------------------------------------------------------
  // INPUT HANDLERS (ligados apenas 1 vez)
  $(document).on("keydown.game", function (e) {
    // Proteções
    if (!jogoAtivo) return;            // só processa durante o jogo
    if (keyPressed) return;            // evita repetição por tecla segurada

    const letraDigitada = (e.key || "").toLowerCase();
    if (!/^[a-z]$/.test(letraDigitada)) return;

    keyPressed = true; // bloqueia até keyup

    if (!letraAtual) {
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

    if (dentroZona && letraDigitada === letraCerta) {
      pontos += 10;
      somAcerto.play();
      $scoreSpan.text(pontos);
      mostrarLetra(true, letraDigitada);
    } else {
      pontos -= 5;
      somErro.play();
      perderVidas();
      mostrarLetra(false, letraDigitada);
    }

    // interrompe animação e prepara próxima letra de forma única
    if (animacaoAtual) {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }
    if (letraAtual) {
      $(letraAtual).remove();
      letraAtual = null;
    }

    indexLetra++;
    iniciarLetra();
  });

  $(document).on("keyup.game", function () {
    keyPressed = false;
  });

  $(document).on("mousedown.game", function (e) {
    if (e.button !== 0) return;
    if (mousePressed) return;

    mousePressed = true;

    // se estiver no menu (jogo não ativo) permite selecionar opções
    if (!jogoAtivo && allOptions.length > 0) {
      // dispara o clique sobre a opção atual (mantém comportamento antigo)
      $(allOptions[currentSelection]).click();
      // libera a flag logo em seguida (em caso de navegação sem reload)
      setTimeout(() => { mousePressed = false; }, 0);
      return;
    }

    if (!jogoAtivo) {
      mousePressed = false;
      return;
    }

    if (!letraAtual) {
      mousePressed = false;
      return;
    }

    const letraCerta = $(letraAtual).data("letra").toLowerCase();
    const letraTop = $(letraAtual).position().top;
    const letraBottom = letraTop + $(letraAtual).outerHeight();
    const hitTop = $hitZone.position().top;
    const hitBottom = hitTop + $hitZone.outerHeight();
    const dentroZona = letraBottom > hitTop && letraTop < hitBottom;

    if (dentroZona) {
      pontos += 10;
      somAcerto.play();
      $scoreSpan.text(pontos);
      mostrarLetra(true, letraCerta);
    } else {
      pontos -= 5;
      somErro.play();
      perderVidas();
      mostrarLetra(false, letraCerta);
    }

    if (animacaoAtual) {
      clearInterval(animacaoAtual);
      animacaoAtual = null;
    }
    if (letraAtual) {
      $(letraAtual).remove();
      letraAtual = null;
    }

    indexLetra++;
    iniciarLetra();
  });

  $(document).on("mouseup.game", function () {
    mousePressed = false;
  });

});
