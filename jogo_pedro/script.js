document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const enemy = document.querySelector('.enemy');
    const scoreText = document.querySelector('.score');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const finalScore = document.getElementById('final-score');
    const highScoreText = document.getElementById('high-score');
    const menuButton = document.getElementById('menu-button');
    const menuPanel = document.querySelector('.menu-panel');
    const difficultySelect = document.getElementById('difficulty');
    const gameModeSelect = document.getElementById('game-mode');
    const nameModal = document.getElementById('name-modal');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreButton = document.getElementById('save-score-button');
    const rankingList = document.getElementById('ranking-list');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const startDifficultySelect = document.getElementById('start-difficulty');
    const startGameModeSelect = document.getElementById('start-game-mode');

    let gameRunning = true;
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let currentDifficulty = 'hard';
    let currentGameMode = 'jogo';
    let animationId;
    let isJumping = false;
    let jumpVelocity = 0;
    const gravity = 0.5;
    const jumpPower = 12;
    let enemySpeed = 8;
    let enemyX = 1000;
    let heroY = 0;
    let heroX = 80;

    function initGame() {
        gameRunning = true;
        score = 0;
        enemyX = 1000;
        heroY = 0;
        isJumping = false;
        updateScore();
        gameOverScreen.style.display = 'none';
        nameModal.style.display = 'none';

        if (currentGameMode === 'treino') {
            enemy.style.display = 'none';
        } else {
            enemy.style.display = 'block';
            enemySpeed = difficultySettings[currentDifficulty].speed;
        }

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
        if (currentGameMode === 'jogo') {
            enemyX -= enemySpeed;

            if (enemyX < -100) {
                enemyX = 1000;
                if (gameRunning) {
                    score++;
                    updateScore();
                }
            }

            const enemyRect = enemy.getBoundingClientRect();
            const heroRect = hero.getBoundingClientRect();

            const isColliding =
                heroRect.right > enemyRect.left &&
                heroRect.left < enemyRect.right &&
                heroRect.bottom > enemyRect.top &&
                heroRect.top < enemyRect.bottom;

            if (isColliding) {
                gameOver();
            }
        }

        if (isJumping) {
            heroY += jumpVelocity;
            jumpVelocity -= gravity;

            if (heroY <= 0) {
                heroY = 0;
                isJumping = false;
                jumpVelocity = 0;
            }
        }
    }

    function render() {
        enemy.style.right = `${enemyX}px`;
        hero.style.bottom = `${heroY}px`;
    }

    function jump() {
        if (!isJumping && gameRunning) {
            isJumping = true;
            jumpVelocity = jumpPower;
        }
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId);

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }

        finalScore.textContent = `Pontuação: ${score}`;
        highScoreText.textContent = `Recorde: ${highScore}`;

        if (checkHighScore(score)) {
            showNameModal();
        } else {
            gameOverScreen.style.display = 'flex';
            updateRanking();
        }
    }

    function resetGame() {
        if (!gameRunning) {
            cancelAnimationFrame(animationId);
            initGame();
        }
    }

    function updateScore() {
        scoreText.textContent = currentGameMode === 'treino' ? 'Modo Treino' : `Pontos: ${score}`;
    }

    function checkHighScore(score) {
        return ranking.length < 5 || score > ranking[ranking.length - 1].score;
    }

    function showNameModal() {
        nameModal.style.display = 'flex';
        playerNameInput.focus();
    }

    function updateRanking() {
        rankingList.innerHTML = '';
        ranking.slice(0, 5).forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.name} - ${entry.score} pts`;
            rankingList.appendChild(li);
        });
    }

    document.addEventListener('click', jump);

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'r' || e.key === 'R') && !gameRunning) {
            nameModal.style.display = 'none';
            resetGame();
        }

        if (e.code === 'Space' && gameRunning) {
            jump();
        }

        if (e.key === 'Escape') {
            if (gameRunning) {
                if (currentGameMode === 'jogo') {
                    scoreText.textContent = `Pontos: ${score}`;
                    gameOver();
                } else if (currentGameMode === 'treino') {
                    gameRunning = false;
                    cancelAnimationFrame(animationId);
                    document.querySelector('.gameboard').style.display = 'none';
                    startScreen.style.display = 'flex';
                }
            } else {
                if (menuPanel.style.display === 'block') {
                    menuPanel.style.display = 'none';
                } else if (nameModal.style.display === 'flex') {
                    nameModal.style.display = 'none';
                } else {
                    gameOverScreen.style.display = 'none';
                }
            }
        }
    });

    menuButton.addEventListener('click', () => {
        if (!gameRunning) {
            menuPanel.style.display = menuPanel.style.display === 'none' ? 'block' : 'none';
        }
    });

    difficultySelect.addEventListener('change', (e) => {
        if (!gameRunning) {
            currentDifficulty = e.target.value;
            enemySpeed = difficultySettings[currentDifficulty].speed;
            menuPanel.style.display = 'none';
        }
    });

    gameModeSelect.addEventListener('change', (e) => {
        if (!gameRunning) {
            currentGameMode = e.target.value;
            resetGame();
            menuPanel.style.display = 'none';
        }
    });

    saveScoreButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim() || 'Jogador';
        ranking.push({ name, score });
        ranking.sort((a, b) => b.score - a.score);
        ranking = ranking.slice(0, 5);
        localStorage.setItem('ranking', JSON.stringify(ranking));
        updateRanking();
        nameModal.style.display = 'none';
        gameOverScreen.style.display = 'flex';
    });

    window.toggleFullScreen = function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const difficultySettings = {
        easy: { speed: 5 },
        medium: { speed: 8 },
        hard: { speed: 12 },
        pro: { speed: 15 },
        extreme: { speed: 20 }
    };

    let ranking = JSON.parse(localStorage.getItem('ranking')) || [];
    updateRanking();

    document.querySelector('.gameboard').style.display = 'none';

    startButton.addEventListener('click', () => {
        currentDifficulty = startDifficultySelect.value;
        currentGameMode = startGameModeSelect.value;
        document.querySelector('.gameboard').style.display = 'block';
        startScreen.style.display = 'none';
        initGame();
    });
});
