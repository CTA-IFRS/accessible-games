// variáveis globais
let speedPeixes = 2.5;
let modoJogo = "easy";
let scanInterval = null;
let currentMenu = "main";
let selectedOptions = { speed: null, mode: null };

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let baleia = { x: 170, y: 500, size: 60, speed: 4 };
let peixes = [];
let score = 0;
let vidas = 3;
let gameOver = false;
let targetItem = "🐟";
let nextItem = "🐠";
let lastFishTime = 0;
let movingLeft = false;
let movingRight = false;
let fishInterval = 1000;
let bubbles = [];

// novo: controla o id do requestAnimationFrame
let animationId = null;

/* --- EFEITOS --- */
function createBubbles() {
    bubbles = [];
    for (let i = 0; i < 30; i++) {
        bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            size: Math.random() * 20 + 10,
            speed: Math.random() * 2 + 1,
            delay: Math.random() * 10000
        });
    }
}

function drawBubbles() {
    const now = Date.now();
    bubbles.forEach(bubble => {
        if (now > bubble.delay) {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y - ((now - bubble.delay) * 0.05 * bubble.speed) % (canvas.height + 200), bubble.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
            ctx.fill();
        }
    });
}

/* --- SCANNING / Acessibilidade --- */
function startScanning(options) {
    stopScanning();
    if (!options || options.length === 0) return;
    let currentFocusIndex = 0;
    const updateFocus = () => {
        options.forEach(opt => opt.classList.remove("focused"));
        options[currentFocusIndex].classList.add("focused");
    };
    updateFocus();
    scanInterval = setInterval(() => {
        currentFocusIndex = (currentFocusIndex + 1) % options.length;
        updateFocus();
    }, 1500);
}

function stopScanning() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    document.querySelectorAll(".menu-option, .game-over-option").forEach(opt => opt.classList.remove("focused"));
}

function selectFocusedOption() {
    const focusedOption = document.querySelector(".menu-option.focused, .game-over-option.focused");
    if (focusedOption) handleOptionClick(focusedOption);
}

function handleOptionClick(option) {
    if (currentMenu === "main") {
        const parentSection = option.closest('.menu-section');
        const allOptionsInGroup = parentSection.querySelectorAll('.menu-option');
        allOptionsInGroup.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");

        if (option.dataset.speed) {
            selectedOptions.speed = parseFloat(option.dataset.speed);
            const nextSection = document.querySelector('.menu-section[data-group="mode"]');
            if (nextSection) startScanning(Array.from(nextSection.querySelectorAll('.menu-option')));
        } else if (option.dataset.mode) {
            selectedOptions.mode = option.dataset.mode;
            if (selectedOptions.speed && selectedOptions.mode) {
                speedPeixes = selectedOptions.speed;
                modoJogo = selectedOptions.mode;
                startGame();
            }
        }
    } else if (currentMenu === "gameOver") {
        if (option.dataset.action === "restart") restartGame();
        else if (option.dataset.action === "menu") backToMenu();
    }
}

/* --- TOUCH CATCHER --- */
function setupTouchCatcher() {
    let catcher = document.querySelector(".touch-catcher");
    if (!catcher) {
        catcher = document.createElement("div");
        catcher.className = "touch-catcher";
        document.body.appendChild(catcher);
    }
    catcher.onclick = null;
    catcher.addEventListener("click", selectFocusedOption);
}
function removeTouchCatcher() {
    const catcher = document.querySelector(".touch-catcher");
    if (catcher) catcher.remove();
}

/* --- EVENTOS DO MOUSE / TOUCH --- */
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("mousedown", e => {
    if (!gameOver && currentMenu === null) {
        if (e.button === 0) movingLeft = true;
        if (e.button === 2) movingRight = true;
    }
});
document.addEventListener("mouseup", e => {
    if (e.button === 0) movingLeft = false;
    if (e.button === 2) movingRight = false;
});

/* --- PEIXES / BALEIA --- */
function criarPeixe() {
    const peixeTypes = ["🐟", "🐠", "🐡"];
    const type = nextItem;
    nextItem = peixeTypes[Math.floor(Math.random() * peixeTypes.length)];
    document.getElementById("nextItem").textContent = nextItem;

    peixes.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        size: 40,
        type: type,
        speed: speedPeixes
    });
}

function desenharBaleia() {
    ctx.font = `${baleia.size}px Arial`;
    ctx.fillStyle = "white";
    ctx.fillText("🐋", baleia.x, baleia.y);
}

function desenharPeixes() {

    ctx.save(); // garante que nada externo afete
    ctx.globalAlpha = 1.0; // opacidade total
    ctx.fillStyle = "white"; // cor fixa pros emojis
    peixes.forEach(peixe => {
        ctx.font = `${peixe.size}px Arial`;
        ctx.fillText(peixe.type, peixe.x, peixe.y);
    });
    ctx.restore();
}

function atualizarPeixes() {
    for (let i = peixes.length - 1; i >= 0; i--) {
        const peixe = peixes[i];
        peixe.y += peixe.speed;
        if (peixe.y + peixe.size > baleia.y &&
            peixe.x < baleia.x + baleia.size &&
            peixe.x + peixe.size > baleia.x) {
            if (peixe.type === targetItem) {
                score++;
                const peixeTypes = ["🐟", "🐠", "🐡"].filter(t => t !== targetItem);
                targetItem = peixeTypes[Math.floor(Math.random() * peixeTypes.length)];
                document.getElementById("targetItem").textContent = targetItem;
            } else {
                vidas--;
                if (vidas <= 0) endGame();
            }
            peixes.splice(i, 1);
            atualizarHUD();
            continue;
        }
        if (peixe.y > canvas.height) peixes.splice(i, 1);
    }
}

function atualizarHUD() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = vidas;
    if (vidas < 3) {
        document.getElementById("lives").style.color = "#d32f2f";
        document.getElementById("lives").style.fontWeight = "bold";
        setTimeout(() => {
            document.getElementById("lives").style.color = "#0d47a1";
        }, 500);
    }
}

function moverBaleia() {
    if (movingLeft) baleia.x = Math.max(0, baleia.x - baleia.speed);
    if (movingRight) baleia.x = Math.min(canvas.width - baleia.size, baleia.x + baleia.speed);
}

/* --- LOOP PRINCIPAL (agora controlado) --- */
function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1e88e5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    drawBubbles();

    if (!gameOver) {
        if (!lastFishTime) lastFishTime = timestamp;
        if (timestamp - lastFishTime > fishInterval) {
            criarPeixe();
            lastFishTime = timestamp;
        }
        moverBaleia();
        atualizarPeixes();
        desenharPeixes();
        desenharBaleia();
    }

    // armazena o id do frame para podermos cancelar depois
    animationId = requestAnimationFrame(gameLoop);
}

/* --- GAME OVER / MENU --- */
function endGame() {
    gameOver = true;
    // interrompe o loop para evitar acumular frames ao reiniciar
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    showGameOverMenu();
}

function showGameOverMenu() {
    const overlay = document.createElement("div");
    overlay.id = "gameOverMenu";
    overlay.innerHTML = `
        <div class="game-over-content">
            <h1>Game Over</h1>
            <p style="font-size: 1.2em; margin: 20px 0;">Pontuação final: ${score}</p>
            <div class="game-over-option" data-action="restart">Reiniciar Jogo</div>
            <div class="game-over-option" data-action="menu">Voltar ao Menu</div>
        </div>
    `;
    document.body.appendChild(overlay);

    currentMenu = "gameOver";
    const options = Array.from(document.querySelectorAll(".game-over-option"));
    startScanning(options);

    overlay.addEventListener("click", function(e) {
        if (!e.target.closest(".game-over-content")) selectFocusedOption();
    });

    options.forEach(option => {
        option.addEventListener("click", function(e) {
            e.stopPropagation();
            options.forEach(opt => opt.classList.remove("focused"));
            this.classList.add("focused");
            selectFocusedOption();
        });
    });
}

function hideGameOverMenu() {
    stopScanning();
    const menu = document.getElementById("gameOverMenu");
    if (menu) menu.remove();
    removeTouchCatcher();
}

function restartGame() {
    hideGameOverMenu();
    // reset básico
    gameOver = false;
    score = 0;
    vidas = 3;
    peixes = [];
    targetItem = "🐟";
    nextItem = "🐠";
    document.getElementById("targetItem").textContent = targetItem;
    document.getElementById("nextItem").textContent = nextItem;
    atualizarHUD();
    currentMenu = null;
    startGame();
}

function backToMenu() {
    hideGameOverMenu();
    document.getElementById("gameArea").style.display = "none";
    // manter "flex" para continuar centralizado verticalmente
    document.getElementById("menuPrincipal").style.display = "flex";
    gameOver = false;
    score = 0;
    vidas = 3;
    peixes = [];
    targetItem = "🐟";
    nextItem = "🐠";
    document.getElementById("targetItem").textContent = targetItem;
    document.getElementById("nextItem").textContent = nextItem;
    currentMenu = "main";
    setupTouchCatcher();

    const firstSectionOptions = Array.from(document.querySelector('.menu-section[data-group="speed"]').querySelectorAll('.menu-option'));
    startScanning(firstSectionOptions);

    selectedOptions.speed = null;
    selectedOptions.mode = null;
    document.querySelectorAll(".menu-option").forEach(opt => opt.classList.remove('selected'));
}

/* --- INICIAR JOGO --- */
function startGame() {
    stopScanning();
    document.getElementById("menuPrincipal").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    currentMenu = null;
    score = 0;
    vidas = 3;
    peixes = [];
    targetItem = "🐟";
    nextItem = "🐠";
    document.getElementById("targetItem").textContent = targetItem;
    document.getElementById("nextItem").textContent = nextItem;
    gameOver = false;
    removeTouchCatcher();
    createBubbles();
    atualizarHUD();

    // garante que não existam múltiplos loops
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    animationId = requestAnimationFrame(gameLoop);
}

/* --- SETUP INICIAL --- */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.menu-section:nth-of-type(1)').dataset.group = "speed";
    document.querySelector('.menu-section:nth-of-type(2)').dataset.group = "mode";

    document.querySelectorAll('.menu-option, .game-over-option').forEach(opt => {
        opt.setAttribute('tabindex', '0');
    });

    setupTouchCatcher();
    const firstSectionOptions = Array.from(document.querySelector('.menu-section[data-group="speed"]').querySelectorAll('.menu-option'));
    startScanning(firstSectionOptions);

    // um único listener para cliques em opções (remove listeners duplicados)
    document.addEventListener("click", (e) => {
        const option = e.target.closest(".menu-option, .game-over-option");
        if (option) {
            e.stopPropagation();
            handleOptionClick(option);
        }
    });
});
