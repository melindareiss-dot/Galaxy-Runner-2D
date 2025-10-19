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

    // --- NEUE EFFEKT-STATUS-VARIABLEN ---
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
            // Zeichnet den Schutzschild, wenn aktiv
            if (shieldActive) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
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
        }
        update() { this.y += this.speed; }
        draw() {
            if (this.type === 0) ctx.fillStyle = '#00FF7F';      // Grün
            else if (this.type === 1) ctx.fillStyle = '#00BFFF'; // Blau
            else if (this.type === 2) ctx.fillStyle = '#9370DB'; // Lila
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
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
        shieldActive = false;
        shieldTimer = 0;
        slowActive = false;
        slowTimer = 0;
    }

    function spawnObjects() {
        if (Math.random() < 0.03) {
            asteroids.push(new Asteroid());
        }
        if (Math.random() < 0.015) { // Erhöhte Spawn-Rate für Kristalle
            const type = Math.floor(Math.random() * 3);
            crystals.push(new Crystal(type));
        }
    }

    function update(dt) {
        stars.forEach(s => s.update());
        asteroids.forEach(a => a.update());
        crystals.forEach(c => c.update());

        // Effekt-Timer aktualisieren
        if (shieldActive) {
            shieldTimer -= dt;
            if (shieldTimer < 0) shieldActive = false;
        }

        if (slowActive) {
            slowTimer -= dt;
            if (slowTimer < 0) {
                slowActive = false;
                // Geschwindigkeit der Asteroiden wiederherstellen
                asteroids.forEach(a => a.speed = a.originalSpeed);
            }
        }

        asteroids = asteroids.filter(a => a.y < height + 50);
        crystals = crystals.filter(c => c.y < height + 50);

        // Kollision mit Asteroiden
        for (let i = asteroids.length - 1; i >= 0; i--) {
            let a = asteroids[i];
            if (Math.hypot(a.x - player.x, a.y - player.y) < (a.size + player.size) / 2) {
                if (shieldActive) {
                    asteroids.splice(i, 1); // Asteroid zerstören
                    shieldActive = false;   // Schild ist nach einem Treffer verbraucht
                } else {
                    running = false;
                    overlay.style.display = 'flex';
                    overlay.innerHTML = `<h1>Game Over!</h1><p>Score: ${Math.floor(score)}</p><p>Tippe, um erneut zu starten!</p>`;
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                    gameOverSound.play();
                    return;
                }
            }
        }

        // Kollision mit Kristallen
        for (let i = crystals.length - 1; i >= 0; i--) {
            let c = crystals[i];
            if (Math.hypot(c.x - player.x, c.y - player.y) < (c.size + player.size) / 2) {
                crystals.splice(i, 1);
                
                if (c.type === 0) { // Grüner Kristall
                    score += 10;
                    collectSound.currentTime = 0;
                    collectSound.play();
                } else if (c.type === 1) { // Blauer Kristall
                    shieldActive = true;
                    shieldTimer = 5000; // 5 Sekunden
                } else if (c.type === 2) { // Lila Kristall
                    if (!slowActive) {
                        slowActive = true;
                        asteroids.forEach(a => a.speed /= 2);
                    }
                    slowTimer = 5000; // 5 Sekunden (oder verlängern)
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
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        spawnObjects();
        update(dt);
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        overlay.style.display = 'none';
        initGame();
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
        
        // Hintergrundmusik starten
        backgroundMusic.play().catch(e => console.error("Hintergrundmusik fehlgeschlagen:", e));
    }

    // --- ANGEPASSTE START-LOGIK FÜR SOUNDS ---
    function firstStart() {
        // Spielt den Start-Sound einmalig und entfernt sich selbst
        startSound.play().catch(e => console.error("Start-Sound fehlgeschlagen:", e));
        startGame(); // Startet das eigentliche Spiel
        
        // Listener entfernen, damit der Startsound nicht nochmal ausgelöst wird
        overlay.removeEventListener('touchend', firstStart);
        overlay.removeEventListener('click', firstStart);

        // Normale Listener für Neustart hinzufügen
        overlay.addEventListener('touchend', e => { e.preventDefault(); startGame(); });
        overlay.addEventListener('click', e => { e.preventDefault(); startGame(); });
    }

    // --- STEUERUNG UND EVENTS ---
    function movePlayer(x, y) { player.x = x; player.y = y; }
    canvas.addEventListener('touchmove', e => { const t = e.touches[0]; movePlayer(t.clientX, t.clientY); });
    canvas.addEventListener('mousemove', e => { if (e.buttons) movePlayer(e.clientX, e.clientY); });
    
    // Initialer Listener für den allerersten Start
    overlay.addEventListener('touchstart', e => e.preventDefault());
    overlay.addEventListener('touchend', firstStart);
    overlay.addEventListener('click', firstStart);
});