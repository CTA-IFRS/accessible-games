$(function () 
{
    let speedPeixes = 2.5;
    let modoJogo = "easy";
    let gameActive = false;

    const canvas = $("#gameCanvas")[0];
    const ctx = canvas.getContext("2d");
    let baleia = { x: 170, y: 500, size: 60, speed: 4 };
    function resizeCanvas() {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        const container = document.getElementById("gameContainer");
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        baleia.x = Math.max(0, Math.min(canvas.width - baleia.size, baleia.x * canvas.width / oldWidth));
        baleia.y = canvas.height - 100;
    }
    window.addEventListener("resize", resizeCanvas);
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

    /* --- EVENTOS DO MOUSE / TOUCH --- */
    document.addEventListener("contextmenu", e => {
        if (gameActive) e.preventDefault();
    });
    document.addEventListener("mousedown", e => {
        if (gameActive && !gameOver) {
            if (e.button === 0) movingLeft = true;
            if (e.button === 2) movingRight = true;
        }
    });
    document.addEventListener("mouseup", e => {
        if (e.button === 0) movingLeft = false;
        if (e.button === 2) movingRight = false;
    });
    document.addEventListener("keydown", e => {
        if (!gameActive || gameOver) return;
        if (e.key === "ArrowLeft") movingLeft = true;
        if (e.key === "ArrowRight") movingRight = true;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
    });
    document.addEventListener("keyup", e => {
        if (e.key === "ArrowLeft") movingLeft = false;
        if (e.key === "ArrowRight") movingRight = false;
    });
    window.addEventListener("blur", () => {
        movingLeft = false;
        movingRight = false;
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
        gameActive = false;
        movingLeft = false;
        movingRight = false;
        // interrompe o loop para evitar acumular frames ao reiniciar
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        showGameOverMenu();
    }

    function showGameOverMenu() {
        window.showGameOver(`Pontuação final: ${score}`);
    }

    /* --- INICIAR JOGO --- */
    function startGame() {
        $("#gameArea").prop('hidden', false);
        resizeCanvas();
        gameActive = true;
        movingLeft = false;
        movingRight = false;
        score = 0;
        vidas = 3;
        peixes = [];
        targetItem = "🐟";
        nextItem = "🐠";
        document.getElementById("targetItem").textContent = targetItem;
        document.getElementById("nextItem").textContent = nextItem;
        gameOver = false;
        createBubbles();
        atualizarHUD();

        // garante que não existam múltiplos loops
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        animationId = requestAnimationFrame(gameLoop);
    }

    window.GameModule = {
        start: function (settings) {
            const speeds = { easy: 1.5, medium: 2.5, hard: 4 };
            speedPeixes = speeds[settings.difficulty] || 2.5;
            modoJogo = settings.difficulty || "medium";
            startGame();
        },
        stop: function () {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
            gameOver = true;
            gameActive = false;
            movingLeft = false;
            movingRight = false;
        },
    };
});
