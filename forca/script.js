// script.js

let velocidade = 1000;
let indice = 0;
let intervalo;
let indiceLetra = 0;
let intervaloLetras;
let tentativa = "";

const botoes = document.querySelectorAll(".opcao");
const menu = document.getElementById("menu");
const jogo = document.getElementById("jogo");
const palavraSecreta = document.getElementById("palavra-secreta");
const letrasContainer = document.getElementById("letras");
const mensagem = document.getElementById("mensagem");

const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const palavra = "CHATGPT";

function iniciarVarredura() {
  if (intervalo) clearInterval(intervalo);
  intervalo = setInterval(() => {
    botoes.forEach((btn, i) => btn.classList.toggle("focado", i === indice));
    indice = (indice + 1) % botoes.length;
  }, velocidade);
}

function pararVarredura() {
  clearInterval(intervalo);
  botoes.forEach((btn) => btn.classList.remove("focado"));
}

function iniciarVarreduraLetras() {
  const botoesLetras = letrasContainer.querySelectorAll("button");
  if (intervaloLetras) clearInterval(intervaloLetras);
  indiceLetra = 0;
  intervaloLetras = setInterval(() => {
    botoesLetras.forEach((btn, i) => btn.classList.toggle("focado", i === indiceLetra));
    indiceLetra = (indiceLetra + 1) % botoesLetras.length;
  }, velocidade);
}

function selecionarLetra(letra) {
  tentativa += letra;

  const exibicao = palavra
    .split("")
    .map((l) => (tentativa.includes(l) ? l : "_"))
    .join(" ");
  palavraSecreta.innerText = "Palavra secreta: " + exibicao;

  if (!palavra.split("").some((l) => !tentativa.includes(l))) {
    mensagem.innerText = "Parabéns! Você acertou!";
    clearInterval(intervaloLetras);
  }
}

function iniciarJogo() {
  palavraSecreta.innerText = "Palavra secreta: " + "_ ".repeat(palavra.length);
  letrasContainer.innerHTML = "";
  tentativa = "";

  letras.forEach((letra) => {
    const btn = document.createElement("button");
    btn.innerText = letra;
    btn.addEventListener("click", () => selecionarLetra(letra));
    letrasContainer.appendChild(btn);
  });

  iniciarVarreduraLetras();
}

// Lógica dos botões do menu
botoes.forEach((btn) => {
  btn.addEventListener("click", () => {
    const texto = btn.innerText.toLowerCase();

    if (texto.includes("lento")) velocidade = 1500;
    else if (texto.includes("médio")) velocidade = 1000;
    else if (texto.includes("rápido")) velocidade = 500;
    else if (texto.includes("jogar")) {
      pararVarredura();
      menu.style.display = "none";
      jogo.style.display = "block";
      iniciarJogo();
      return;
    }

    iniciarVarredura();
  });
});

iniciarVarredura();
            