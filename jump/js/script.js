document.addEventListener('DOMContentLoaded', () => {
    // Characters
    const hero = document.querySelector('.hero');
    const enemy = document.querySelector('.enemy');

    // Game UI
    const scoreText = document.querySelector('.score');
    const livesContainer = document.querySelector('.lives');

    // Game Screens
    const gameOverScreen = document.querySelector('.game-over-screen');
    const finalScore = document.getElementById('final-score');
    const highScoreText = document.getElementById('high-score');
    const rankingList = document.getElementById('ranking-list');

    const configScreen = document.getElementById('game-config-screen');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');

    // Sounds
    const jumpSound = new Audio("sounds/jump.mp3");
    const damageSound = new Audio("sounds/damage.mp3");
    const gameOverSound = new Audio("sounds/gameover.mp3");

    // Globals
    let gameRunning = true;
    let score = 0;
    let lives = 3;
    let highScore = parseInt(localStorage.getItem('highScore')) || 0;
    let currentDifficulty = 'hard';
    let currentGameMode = 'jogo';

    let animationId;
    let isJumping = false;
    let jumpVelocity = 0;
    let gravity = 0.5;
    const jumpPower = 12;
    let enemySpeed = 8;
    let enemyX = window.innerWidth;
    let heroY = 0;

    let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

    // ====== MODO VARREDURA ======
    let scanInterval = null;
    let scanIndex = 0;
    let scanElements = [];
    let scanning = false;
    let scanContainer = null;

    function visibleButtons(container) {
        if (!container) return [];
        const all = Array.from(container.querySelectorAll('button:not([disabled])'));
        return all.filter(btn => btn.offsetParent !== null);
    }

    function startScanning(containerSelector) {
        stopScanning();

        scanContainer = document.querySelector(containerSelector);
        if (!scanContainer) return;

        scanElements = visibleButtons(scanContainer);
        if (scanElements.length === 0) return;

        scanIndex = 0;
        scanning = true;
        highlightScanItem();

        scanInterval = setInterval(() => {
            const currentList = visibleButtons(scanContainer);
            if (currentList.length === 0) {
                stopScanning();
                return;
            }
            scanElements = currentList;
            scanIndex = (scanIndex + 1) % scanElements.length;
            highlightScanItem();
        }, 1500);
    }

    function stopScanning() {
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
        removeHighlight();
        scanning = false;
        scanContainer = null;
    }

    function highlightScanItem() {
        removeHighlight();
        const current = scanElements[scanIndex];
        if (current) {
            current.classList.add('scan-highlight', 'scan-hover');
            current.setAttribute('aria-current', 'true');
            if (typeof current.focus === 'function') {
                current.focus({ preventScroll: true });
            }
        }
    }

    function removeHighlight() {
        scanElements.forEach(el => {
            el.classList.remove('scan-highlight', 'scan-hover');
            el.removeAttribute('aria-current');
        });
    }

    // Clique global: aciona o botão em destaque
    document.addEventListener('click', (e) => {
        if (!scanning) return;
        if (!e.isTrusted) return;

        const current = scanElements[scanIndex];
        if (!current) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        if (typeof current.focus === 'function') {
            current.focus({ preventScroll: true });
        }
        current.classList.add('pressed-by-scan');
        current.click();

        setTimeout(() => current.classList.remove('pressed-by-scan'), 150);
    }, true);

    (function injectScanStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
        .scan-highlight {
            outline: 3px solid #007bff !important;
            box-shadow: 0 0 0 4px rgba(0,123,255,0.15) !important;
        }
        button.scan-hover {
            background: #f0f0f0 !important;
        }
        button.pressed-by-scan {
            transform: scale(0.98);
        }`;
        document.head.appendChild(style);
    })();

    // ====== DIFICULDADES ======
    const difficultySettings = {
        easy:    { speed: 5,  gravity: 0.4 },
        medium:  { speed: 8,  gravity: 0.5 },
        hard:    { speed: 12, gravity: 0.6 },
        pro:     { speed: 15, gravity: 0.7 },
        extreme: { speed: 20, gravity: 0.8 }
    };

    document.querySelectorAll('#start-screen button').forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            setMode(mode);
            document.querySelector('.gameboard').style.display = 'flex';
            startScreen.style.display = 'none';
            stopScanning();
            initGame();
        });
    });

    function setMode(modo) {
        if (difficultySettings.hasOwnProperty(modo)) {
            currentDifficulty = modo;
            enemySpeed = difficultySettings[modo].speed;
            gravity = difficultySettings[modo].gravity;
        }
    }
    window.setMode = setMode;

    function updateLivesDisplay() {
        livesContainer.textContent = "❤️".repeat(lives);
    }

    function initGame() {
        gameRunning = true;
        score = 0;
        lives = 3;
        updateLivesDisplay();
        enemyX = window.innerWidth;
        heroY = 25;
        isJumping = false;
        updateScore();
        gameOverScreen.style.display = 'none';
        enemy.style.display = 'block';
        startGameLoop();
    }

    function startGameLoop() {
        if (animationId) cancelAnimationFrame(animationId);
        function gameLoop() {
            update();
            render();
            if (gameRunning) animationId = requestAnimationFrame(gameLoop);
        }
        gameLoop();
    }

    function update() {
        enemyX -= enemySpeed;
        if (enemyX < -100) {
            enemyX = window.innerWidth;
            if (gameRunning) {
                score++;
                updateScore();
            }
        }
        const enemyRect = enemy.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const padding = 10;
        const isColliding =
            heroRect.right - padding > enemyRect.left + padding &&
            heroRect.left + padding < enemyRect.right - padding &&
            heroRect.bottom - padding > enemyRect.top + padding &&
            heroRect.top + padding < enemyRect.bottom - padding;
        if (isColliding) {
            handleCollision();
        }
        if (isJumping) {
            heroY += jumpVelocity;
            jumpVelocity -= gravity;
            if (heroY <= 25) {
                heroY = 25;
                isJumping = false;
                jumpVelocity = 0;
            }
        }
    }

    function render() {
        enemy.style.left = `${enemyX}px`;
        hero.style.bottom = `${heroY}px`;
    }

    function jump() {
        if (!isJumping && gameRunning) {
            isJumping = true;
            jumpVelocity = jumpPower;
            jumpSound.currentTime = 0;
            jumpSound.play();
        }
    }

    function handleCollision() {
        if (lives > 0) {
            lives--;
            updateLivesDisplay();
            if (lives > 0) {
                damageSound.currentTime = 0;
                damageSound.play();
            }
        }
        enemyX = window.innerWidth;
        if (lives <= 0) {
            gameOver();
        }
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        gameOverScreen.style.display = 'flex';
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) gameScreen.style.display = 'none';
        finalScore.textContent = `Pontuação: ${score}`;
        highScoreText.textContent = `Recorde: ${highScore}`;
        startScanning('.game-over-screen');
    }

    function resetGame() {
        if (!gameRunning) {
            cancelAnimationFrame(animationId);
            initGame();
        }
    }

    function updateScore() {
        scoreText.textContent = currentGameMode === 'treino' ? 'Modo Treino' : `Pontos: ${score}`;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            highScoreText.textContent = `Recorde: ${highScore}`;
        }
    }

    function updateRanking() {
        rankingList.innerHTML = '';
        ranking.slice(0, 5).forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.name} - ${entry.score} pts`;
            rankingList.appendChild(li);
        });
    }

    document.addEventListener('click', (event) => {
        if (scanning) return;

        if (
            event.target.tagName === 'BUTTON' ||
            event.target.closest('button') ||
            event.target.closest('.menu-panel') ||
            event.target.closest('.game-over-screen') ||
            event.target.closest('#start-screen')
        ) {
            return;
        }
        jump();

        if (startScreen && startScreen.style.display !== 'none') {
            startScanning('#start-screen');
        }
    });

    window.toggleFullScreen = function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    document.querySelector('.gameboard').style.display = 'none';
    startButton.addEventListener('click', () => {
        document.querySelector('.gameboard').style.display = 'block';
        startScreen.style.display = 'none';
        stopScanning();
        initGame();
    });

    // Inicia varredura na tela inicial automaticamente
    if (startScreen && startScreen.style.display !== 'none') {
        startScanning('#start-screen');
    }
});