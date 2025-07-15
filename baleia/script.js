const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const targetItemElement = document.getElementById("targetItem");
const scoreElement = document.getElementById("score");
const bubblesContainer = document.getElementById("bubbles");
const velocidadeControl = document.getElementById("velocidadeControl");
const velocidadeValor = document.getElementById("velocidadeValor");

const whaleImg = new Image();
whaleImg.src = 'https://images.vexels.com/content/259565/preview/blue-whale-sea-animals-18f5a8.png';

const fishImages = {
    '🐟': 'https://img.icons8.com/?size=192&id=OClCFhCarb8m&format=png',
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
    img: whaleImg,
    direcao: "direita"
};

let peixesCaindo = [];
let pontos = 0;
let velocidadeJogo = 60;
let velocidadePeixes = 1;

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

function animarComida(x, y) {
    const splash = document.createElement("div");
    splash.classList.add("bubble");
    splash.style.width = "40px";
    splash.style.height = "40px";
    splash.style.left = `${x}px`;
    splash.style.top = `${y}px`;
    splash.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    splash.style.position = "absolute";
    splash.style.borderRadius = "50%";
    splash.style.transform = "scale(1)";
    splash.style.transition = "all 0.5s ease-out";
    splash.style.zIndex = "2";
    bubblesContainer.appendChild(splash);

    setTimeout(() => {
        splash.style.transform = "scale(2)";
        splash.style.opacity = "0";
    }, 10);

    setTimeout(() => {
        splash.remove();
    }, 600);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (baleia.direcao === "esquerda") {
        ctx.scale(-1, 1);
        ctx.drawImage(baleia.img, -baleia.x - baleia.largura, baleia.y, baleia.largura, baleia.altura);
    } else {
        ctx.drawImage(baleia.img, baleia.x, baleia.y, baleia.largura, baleia.altura);
    }
    ctx.restore();

    peixesCaindo.forEach(peixe => {
        const img = new Image();
        img.src = fishImages[peixe.emoji];
        ctx.drawImage(img, peixe.x, peixe.y, 40, 40);
    });
}

function atualizar() {
    peixesCaindo.forEach(peixe => {
        peixe.y += velocidadePeixes;

        if (peixe.y >= baleia.y - 30 && peixe.x >= baleia.x && peixe.x <= baleia.x + baleia.largura) {
            if (peixe.emoji === peixeAlvo) {
                pontos += 5;
                animarComida(peixe.x, peixe.y);
            } else {
                pontos = Math.max(0, pontos - 2);
            }
            scoreElement.textContent = `Pontos: ${pontos}`;
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
        if (peixesCaindo.length > 0) {
            const aleatorio = Math.floor(Math.random() * peixesCaindo.length);
            peixeAlvo = peixesCaindo[aleatorio].emoji;
        } else {
            peixeAlvo = peixesDisponiveis[Math.floor(Math.random() * peixesDisponiveis.length)];
        }
        targetItemElement.textContent = peixeAlvo;
    }

    desenhar();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        baleia.x = Math.max(10, baleia.x - 25);
        baleia.direcao = "esquerda";
    } else if (e.key === "ArrowRight") {
        baleia.x = Math.min(canvas.width - baleia.largura - 10, baleia.x + 25);
        baleia.direcao = "direita";
    }
});

document.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        baleia.x = Math.max(10, baleia.x - 25);
        baleia.direcao = "esquerda";
    } else if (e.button === 2) {
        baleia.x = Math.min(canvas.width - baleia.largura - 10, baleia.x + 25);
        baleia.direcao = "direita";
    }
});

document.addEventListener("contextmenu", (e) => e.preventDefault());

velocidadeControl.addEventListener("input", () => {
    velocidadePeixes = parseFloat(velocidadeControl.value);
    velocidadeValor.textContent = velocidadePeixes.toFixed(1);
});

function iniciarJogo() {
    targetItemElement.textContent = peixeAlvo;
    scoreElement.textContent = `Pontos: ${pontos}`;
    criarBolhas();

    whaleImg.onload = () => {
        Object.values(fishImages).forEach(src => {
            const img = new Image();
            img.src = src;
        });

        setInterval(atualizar, velocidadeJogo);
    };
}

window.addEventListener("DOMContentLoaded", iniciarJogo);

