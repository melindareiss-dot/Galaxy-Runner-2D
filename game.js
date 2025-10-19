document.addEventListener('DOMContentLoaded', () => {
    
    // VARIABLEN UND KONSTANTEN
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const scoreDisplay = document.getElementById('score');

    // --- SOUNDS ---
    const startSound = new Audio('https://audio.jukehost.co.uk/GSmTILOxBTpeKHj5qGyiitJLYqVwh6aE');
    const backgroundMusic = new Audio('https://audio.jukehost.co.uk/pYUtckzLOyf3LUrV506FrdtngI0XiPCo');
    const collectSound = new Audio('https://audio.jukehost.co.uk/dDi8yejBQycWwoFRGKY3ttYSftXPWZ2v');
    const gameOverSound = new Audio('https://audio.jukehost.co.uk/xiLuS0OQwACqtvfJn0hNGmoD9rtpaAOh');

    // --- SOUND-EINSTELLUNGEN ---
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    collectSound.volume = 0.8;
    gameOverSound.volume = 0.8;
    startSound.volume = 0.7;

    // --- EFFEKT-STATUS-VARIABLEN ---
    let shieldActive = false;
    let shieldTimer = 0;
    let slowActive = false;
    let slowTimer = 0;
    
    let width, height, running = false, lastTime = 0, score = 0;
    let player, stars = [], asteroids = [], crystals = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // --- KLASSEN ---
    class Star {
        constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.size = Math.random() * 2; this.speed = this.size * 0.5; }
        update() { this.y += this.speed; if (this.y > height) { this.y = 0; this.x = Math.random() * width; } }
        draw() { ctx.fillStyle = 'white'; ctx.fillRect(this.x, this.y, this.size, this.size); }
    }

    class Player {
        constructor() { this.x = width / 2; this.y = height * 0.8; this.size = 40; }
        draw() {
            if (shieldActive) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size / 2);
            ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
            ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Asteroid {
        constructor() { this.x = Math.random() * width; this.y = -20; this.size = 20 + Math.random() * 40; this.speed = 2 + Math.random() * 3; this.originalSpeed = this.speed; }
        update() { this.y += this.speed; }
        draw() { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }

    class Crystal {
        constructor(type) {
            this.x = Math.random() * width;
            this.y = -20;
            this.size = 15;
            this.speed = 3;
            this.type = type; // 0=grün, 1=blau, 2=lila
            this.shimmerPhase = Math.random() * Math.PI;
        }
        update() { this.y += this.speed; }
        draw() {
            if (this.type === 0) {
                ctx.fillStyle = '#00FF7F'; // Grün
            } else if (this.type === 1) {
                const alpha = 0.6 + 0.4 * Math.sin(Date.now() / 150 + this.shimmerPhase);
                ctx.fillStyle = `rgba(0, 191, 255, ${alpha})`; // Funkel-Blau
            } else if (this.type === 2) {
                ctx.fillStyle = '#9370DB'; // Lila
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            if (this.type === 2) {
                const radius = this.size * 0.6;
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y - radius * 0.8);
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + radius * 0.5, this.y);
                ctx.stroke();
            }
        }
    }

    // --- SPIELFUNKTIONEN ---
    function initGame() {
        resize();
        stars = Array.from({ length: 80 }, () => new Star());
        player = new Player();
        asteroids = [];
        crystals = [];
        score = 0;
        shieldActive = false; shieldTimer = 0;
        slowActive = false; slowTimer = 0;
    }

    function spawnObjects() {
        if (Math.random() < 0.035) asteroids.push(new Asteroid());
        
        const rand = Math.random();
        if (rand < 0.008) { // Seltene Chance für Blau
            crystals.push(new Crystal(1)); 
        } else if (rand < 0.016) { // Seltene Chance für Lila
            crystals.push(new Crystal(2));
        } else if (rand < 0.05) { // Höhere Chance für Grün
            crystals.push(new Crystal(0));
        }
    }

    function update(dt) {
        stars.forEach(s => s.update());
        asteroids.forEach(a => a.update());
        crystals.forEach(c => c.update());

        if (shieldActive) {
            shieldTimer -= dt;
            if (shieldTimer < 0) shieldActive = false;
        }
        if (slowActive) {
            slowTimer -= dt;
            if (slowTimer < 0) {
                slowActive = false;
                asteroids.forEach(a => a.speed = a.originalSpeed);
            }
        }

        asteroids = asteroids.filter(a => a.y < height + 50);
        crystals = crystals.filter(c => c.y < height + 50);

        for (let i = asteroids.length - 1; i >= 0; i--) {
            let a = asteroids[i];
            if (Math.hypot(a.x - player.x, a.y - player.y) < (a.size + player.size) / 2) {
                if (shieldActive) {
                    asteroids.splice(i, 1);
                    shieldActive = false;
                } else {
                    running = false;
                    overlay.style.display = 'flex';
                    overlay.innerHTML = `<h1>Game Over</h1><p>Score: ${Math.floor(score)}</p><p>Tippe zum Neustart</p>`;
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                    gameOverSound.play();
                    return;
                }
            }
        }

        for (let i = crystals.length - 1; i >= 0; i--) {
            let c = crystals[i];
            if (Math.hypot(c.x - player.x, c.y - player.y) < (c.size + player.size) / 2) {
                crystals.splice(i, 1);
                collectSound.currentTime = 0;
                collectSound.play();

                if (c.type === 0) {
                    score += 10;
                } else if (c.type === 1) {
                    shieldActive = true;
                    shieldTimer = 5000;
                } else if (c.type === 2) {
                    if (!slowActive) {
                        slowActive = true;
                        asteroids.forEach(a => { a.speed /= 2; });
                    }
                    slowTimer = 3000; // Jetzt 3 Sekunden
                }
            }
        }
        
        score += dt * 0.05;
        scoreDisplay.textContent = `SCORE: ${Math.floor(score)}`;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(s => s.draw());
        player.draw();
        asteroids.forEach(a => a.draw());
        crystals.forEach(c => c.draw());
    }

    function loop(timestamp) {
        if (!running) return;
        const dt = timestamp - lastTime; lastTime = timestamp;
        spawnObjects(); update(dt); draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        overlay.style.display = 'none';
        initGame();
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
        
        if (!backgroundMusic.playing) {
            backgroundMusic.play().catch(e => console.error("Hintergrundmusik fehlgeschlagen:", e));
        }
    }

    // --- FINALE SOUND-LOGIK ---
    let isFirstInteraction = true;
    function handleFirstInteraction() {
        if (isFirstInteraction) {
            isFirstInteraction = false;
            overlay.innerHTML = `<h1>Galaxy Runner 2D</h1><p>Lade...</p>`; // Lade-Feedback
            
            startSound.play().catch(e => console.log("Startsound blockiert."));
            
            // Warte, bis der Startsound zu Ende ist (oder max. 5 Sek.), dann starte das Spiel
            const soundDuration = 5000; // 5 Sekunden
            setTimeout(() => {
                startSound.pause();
                startSound.currentTime = 0;
                startGame();
            }, soundDuration);

        } else {
            // Dies ist für den Neustart nach Game Over
            startGame();
        }
    }

    // --- STEUERUNG UND EVENTS ---
    function movePlayer(x, y) { player.x = x; player.y = y; }
    canvas.addEventListener('touchmove', e => { const t = e.touches[0]; movePlayer(t.clientX, t.clientY); });
    canvas.addEventListener('mousemove', e => { if (e.buttons) movePlayer(e.clientX, e.clientY); });
    
    // Dynamischer Listener, der nur einmal den Startsound auslöst
    const initialStartListener = (e) => {
        e.preventDefault();
        handleFirstInteraction();
        // Entfernt sich selbst nach dem ersten Klick, um nur noch Neustarts zu behandeln
        overlay.removeEventListener('touchend', initialStartListener);
        overlay.removeEventListener('click', initialStartListener);

        // Fügt neue Listener für Neustarts hinzu
        overlay.addEventListener('touchend', (e) => {e.preventDefault(); handleFirstInteraction();});
        overlay.addEventListener('click', (e) => {e.preventDefault(); handleFirstInteraction();});
    };

    overlay.addEventListener('touchstart', e => e.preventDefault());
    overlay.addEventListener('touchend', initialStartListener);
    overlay.addEventListener('click', initialStartListener);
});
