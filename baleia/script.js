
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const targetItemElement = document.getElementById("targetItem");
const scoreElement = document.getElementById("score");
const bubblesContainer = document.getElementById("bubbles");


const whaleImg = new Image();
whaleImg.src = 'https://images.vexels.com/content/259565/preview/blue-whale-sea-animals-18f5a8.png';

const fishImages = {
    '🐟': 'https://img.icons8.com/?size=192&id=OClCFhCarb8m&format=png ',
    '🐠': 'https://images.emojiterra.com/google/android-pie/512px/1f420.png',
    '🐡': 'https://images.emojiterra.com/google/android-10/512px/1f421.png'
};


const peixesDisponiveis = ['🐟', '🐠', '🐡'];
let peixeAlvo = '🐟';
let baleia = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    largura: 100,
    altura: 60,
    img: whaleImg
};
let peixesCaindo = [];
let pontos = 0;
let velocidadeJogo = 60;
let velocidadePeixes = 1; 


const botoes = document.querySelectorAll(".action-btn");
let botaoAtual = 0;
let intervaloScan;


function criarBolhas() {
    for (let i = 0; i < 50; i++) {
        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        const size = Math.random() * 20 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.bottom = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 20 + 10}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        bubblesContainer.appendChild(bubble);
    }
}


function iniciarScan() {
    if (intervaloScan) clearInterval(intervaloScan);
    
    botaoAtual = 0;
    botoes[botaoAtual].focus();
    
    intervaloScan = setInterval(() => {
        botoes[botaoAtual].blur();
        botaoAtual = (botaoAtual + 1) % botoes.length;
        botoes[botaoAtual].focus();
    }, 3000); // Varre a cada 3 segundos
}


function desenhar() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    ctx.drawImage(baleia.img, baleia.x, baleia.y, baleia.largura, baleia.altura);

    peixesCaindo.forEach(peixe => {
        const img = new Image();
        img.src = fishImages[peixe.emoji];
        ctx.drawImage(img, peixe.x, peixe.y, 40, 40);
    });
  }
function atualizar() {

    peixesCaindo.forEach(peixe => {
        peixe.y += velocidadePeixes;
     
        if (peixe.y >= baleia.y - 30 && 
            peixe.x >= baleia.x && 
            peixe.x <= baleia.x + baleia.largura) {
            
            if (peixe.emoji === peixeAlvo) {
                pontos += 5;
                scoreElement.textContent = `Pontos: ${pontos}`;
            } else {
                pontos = Math.max(0, pontos - 2);
                scoreElement.textContent = `Pontos: ${pontos}`;
            }
            
            peixesCaindo = peixesCaindo.filter(p => p !== peixe);
        }
        
        
        if (peixe.y > canvas.height) {
            peixesCaindo = peixesCaindo.filter(p => p !== peixe);
        }
    });
    
    
    if (Math.random() < 0.01) { 
        const novoPeixe = {
            emoji: peixesDisponiveis[Math.floor(Math.random() * peixesDisponiveis.length)],
            x: Math.random() * (canvas.width - 40),
            y: -40
        };
        peixesCaindo.push(novoPeixe);
    }
    
    
    if (Math.random() < 0.003) { 
        peixeAlvo = peixesDisponiveis[Math.floor(Math.random() * peixesDisponiveis.length)];
        targetItemElement.textContent = peixeAlvo;
    }
    
    desenhar();
}


document.addEventListener("click", (evento) => {
    if (evento.target.classList.contains("action-btn")) return;
    
    const acao = botoes[botaoAtual].dataset.action;
    
    if (acao === "left") {
        baleia.x = Math.max(10, baleia.x - 25);
    } else if (acao === "right") {
        baleia.x = Math.min(canvas.width - baleia.largura - 10, baleia.x + 25);
    }
});


function iniciarJogo() {
    targetItemElement.textContent = peixeAlvo;
    scoreElement.textContent = `Pontos: ${pontos}`;
    criarBolhas();
    iniciarScan();
    
 
    whaleImg.onload = () => {
        Object.values(fishImages).forEach(src => {
            const img = new Image();
            img.src = src;
        });
        
        setInterval(atualizar, velocidadeJogo);
    };
}


window.addEventListener("DOMContentLoaded", iniciarJogo);