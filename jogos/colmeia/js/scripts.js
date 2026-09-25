$(document).ready(function () {
  const $gameContainer = $('#hiveGame');
  const $hitZone = $('#hitZone');
  const $scoreSpan = $('#points');
  const $typedSpan = $('#typedWord');

  let velocidadeSelecionada = "medium";

  // Local Storage helpers
  function getSavedWords() 
  {
    const saved = localStorage.getItem("palavrasColmeia");

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
    localStorage.setItem("palavrasColmeia", JSON.stringify(words));
  }

  let palavras = getSavedWords();
  if (!palavras.length) 
  {
    palavras = ["IFRS", "ACESSIBILIDADE", "CTA"];

    saveWords(palavras);
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

    $gameContainer.prop('hidden', false);
    jogoAtivo = true;
    $scoreSpan.text(pontos);
    vidas = maxVidas;
    indexLetra = 0;
    $typedSpan.html("");
    palavraAtual = palavras[Math.floor(Math.random() * palavras.length)];
    atualizarVidas();

    // reset input-lock flags (evita herdar estado de pressionamento)
    keyPressed = false;

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

  function tentarLetra(letraDigitada) 
  {
    if (!jogoAtivo || !letraAtual) return;

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
      if (pontos > 5) pontos -= 5;
      $scoreSpan.text(pontos);
      somErro.play();
      perderVidas();
      mostrarLetra(false, letraDigitada);
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

    indexLetra++;
    iniciarLetra();
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

    tentarLetra(letraDigitada);
  });

  $gameContainer.on("click.game", function () 
  {
    if (!jogoAtivo || !letraAtual) return;
    tentarLetra($(letraAtual).data("letra").toLowerCase());
  });

  $(document).on("keyup.game", function () 
  {
    keyPressed = false;
  });

  /* game over menu */
  function mostrarMenuGameOver() 
  {
    jogoAtivo = false;

    // limpa intervals/timeouts e letras na tela
    limparEstado();

    // zera flags para evitar input preso
    keyPressed = false;

    window.showGameOver("Suas vidas acabaram. Pontuação: " + pontos);
  }

  window.GameModule = {
    start: function (settings) {
      velocidadeSelecionada = settings.difficulty || "medium";
      pontos = 0;
      $("#gameOverMenu").hide();
      novaRodada();
    },
    stop: function () { jogoAtivo = false; limparEstado(); },
    usesCommonScan: function () { return true; }
  };
});
