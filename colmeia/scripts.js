const palavras = ['LIVRO', 'TESTE', 'ACESSIBILIDADE', 'CADEIRA', 'GATO'];
let palavraAtual = '';
let indexLetra = 0;
let pontos = 0;
let letraAtual = null;
let animacaoAtual = null;
let velocidade = 1

const container = document.getElementById('game-container');
const hitZone = document.getElementById('hit-zone');
const scoreSpan = document.getElementById('points');
const typedSpan = document.getElementById('typed-word');
const somAcerto = new Audio('somAcerto.mp3');  
const somErro = new Audio('somErro.mp3');

const velocidadeInput = document.getElementById('velocidade');
  velocidadeInput.addEventListener('input', () => {
  velocidade = parseInt(velocidadeInput.value);
});




function novaRodada() {
  container.querySelectorAll('.letter').forEach(e => e.remove());
  palavraAtual = palavras[Math.floor(Math.random() * palavras.length)];
  indexLetra = 0;
  typedSpan.innerHTML = '';
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
  
  animacaoAtual = setInterval(() => {
    top += velocidade;
    letraEl.style.top = top + 'px';

    if (top > container.offsetHeight) {
      clearInterval(animacaoAtual);
      letraEl.remove();
      mostrarLetra(false, letraEl.dataset.letra); // não digitou = erro
      letraAtual = null;
      indexLetra++;
      setTimeout(() => iniciarLetra(), 500);
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
  if (!letraAtual) return;

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
      mostrarLetra(false, letraDigitada); // erro dentro da zona
    }
  } else {
    // erro
    mostrarLetra(false, letraDigitada);
    somErro.play();
  }

  clearInterval(animacaoAtual);
  letraAtual.remove();
  letraAtual = null;
  indexLetra++;
  iniciarLetra();
});



novaRodada();