const palavras = ['LIVRO', 'TESTE', 'ACESSIBILIDADE', 'CADEIRA', 'GATO'];
let palavraAtual = '';
let indexLetra = 0;
let pontos = 0;
let letraAtual = null;
let animacaoAtual = null;
let vidas = 3;
const maxVidas = 3;
let jogoAtivo = true;

document.getElementById('retry').addEventListener('click', () => {
  document.getElementById('game-over').style.display = 'none';
  novaRodada();
});

document.getElementById('menu').addEventListener('click', () => {
  window.location.href = "./home/index.html";
});


const velocidadeSelecionada = localStorage.getItem("velocidadeJogo");

let velocidade;
switch (velocidadeSelecionada) {
  case "slow":
    velocidade = 2; // mais lento
    break;
  case "medium":
    velocidade = 4; // intermediário
    break;
  case "fast":
    velocidade = 8; // mais rápido
    break;
  default:
    velocidade = 2; // padrão
}

const container = document.getElementById('game-container');
const hitZone = document.getElementById('hit-zone');
const scoreSpan = document.getElementById('points');
const typedSpan = document.getElementById('typed-word');
const somAcerto = new Audio('somAcerto.mp3');  
const somErro = new Audio('somErro.mp3');
const retornarBtn = document.getElementById("BtnReturn");

retornarBtn.addEventListener("click", () => {
  window.location.href = "./home/index.html"; 
});


function novaRodada() {
  jogoAtivo = true;

  container.querySelectorAll('.letter').forEach(e => e.remove());
  pontos = 0;
  scoreSpan.textContent = pontos;
  vidas = maxVidas;
  indexLetra = 0;
  typedSpan.innerHTML = '';
  palavraAtual = palavras[Math.floor(Math.random() * palavras.length)];
  
  atualizarVidas();
  iniciarLetra();
}

function criarLetra(letra) {
  const div = document.createElement('div');
  div.classList.add('letter');
  div.textContent = letra;
  div.dataset.letra = letra;
  div.style.top = '0px';
  container.appendChild(div);
  return div;
}

function animarLetra(letraEl) {
  let top = 0;
  
  if (!jogoAtivo){
      clearInterval(animacaoAtual);
      return;
  }

  animacaoAtual = setInterval(() => {
    top += velocidade;
    letraEl.style.top = top + 'px';

    if (top > container.offsetHeight) {
      clearInterval(animacaoAtual);
      letraEl.remove();
      mostrarLetra(false, letraEl.dataset.letra); // não digitou = erro
      perderVidas();
      somErro.play();
      letraAtual = null;
      indexLetra++;

      if (jogoAtivo) { // só continuar se o jogo ainda estiver ativo
        setTimeout(() => iniciarLetra(), 500);
      }
    }
  }, 16);
}

function iniciarLetra() {
  if (indexLetra >= palavraAtual.length) {
    setTimeout(novaRodada, 2000);
    return;
  }

  const letra = palavraAtual[indexLetra];
  const letraEl = criarLetra(letra);
  letraAtual = letraEl;
  animarLetra(letraEl);
}

function mostrarLetra(acertou, letra = '') {
  const span = document.createElement('span');
  span.textContent = letra.toUpperCase();
  span.classList.add(acertou ? 'correct' : 'wrong');
  
  typedSpan.appendChild(span);
}

document.addEventListener('keydown', (e) => {
  if (!jogoAtivo || !letraAtual) return;

  const letraDigitada = e.key.toLowerCase();
  const letraCerta = letraAtual.dataset.letra.toLowerCase();

  // Ignora se a tecla não for uma letra (ex: shift, tab, etc)
  if (!/^[a-z]$/.test(letraDigitada)) return;

  const letraTop = letraAtual.offsetTop;
  const letraBottom = letraTop + letraAtual.offsetHeight;
  const hitTop = hitZone.offsetTop;
  const hitBottom = hitTop + hitZone.offsetHeight;

  const dentroZona = letraBottom > hitTop && letraTop < hitBottom;

  if (dentroZona) {
    // Dentro da zona
    if (letraDigitada === letraCerta) {
      pontos += 10;
      scoreSpan.textContent = pontos;
      mostrarLetra(true, letraDigitada);
      somAcerto.play();
    } else {
      somErro.play();
      perderVidas();
      mostrarLetra(false, letraDigitada); // erro dentro da zona
    }
  } else {
    // erro
    perderVidas();
    mostrarLetra(false, letraDigitada);
    somErro.play();
  }

  clearInterval(animacaoAtual);
  letraAtual.remove();
  letraAtual = null;
  indexLetra++;
  iniciarLetra();
});

function mostrarMenuGameOver() {
  jogoAtivo = false;
  if (animacaoAtual) {
    clearInterval(animacaoAtual);
    animacaoAtual = null;
  }
  if (letraAtual) {
    letraAtual.remove();
    letraAtual = null;
  }
  document.getElementById('game-over').style.display = 'block';
}

function atualizarVidas(){
  const coracao = '❤️';
  document.getElementById('vidas').textContent = coracao.repeat(vidas);
}

function perderVidas(){
  vidas--;
  atualizarVidas();

  if(vidas <= 0){
    mostrarMenuGameOver();
  }
}

novaRodada();