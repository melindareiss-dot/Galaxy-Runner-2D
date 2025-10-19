document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLEN UND KONSTANTEN ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const scoreDisplay = document.getElementById('score');

    let width, height, running = false, lastTime = 0, score = 0;
    let player, stars, asteroids, crystals;

    // --- SOUNDS HINZUFÜGEN (FINALE LINKS) ---
    const startSound = new Audio('https://audio.jukehost.co.uk/GSmTILOxBTpeKHj5qGyiitJLYqVwh6aE');
    const backgroundMusic = new Audio('https://audio.jukehost.co.uk/pYUtckzLOyf3LUrV506FrdtngI0XiPCo');
    const collectSound = new Audio('https://audio.jukehost.co.uk/dDi8yejBQycWwoFRGKY3ttYSftXPWZ2v');
    const gameOverSound = new Audio('https://audio.jukehost.co.uk/xiLuS0OQwACqtvfJn0hNGmoD9rtpaAOh');

    // --- SOUND-EINSTELLUNGEN ---
    backgroundMusic.loop = true; // Hintergrundmusik läuft in einer Schleife
    backgroundMusic.volume = 0.5; // Lautstärke anpassen (0.0 bis 1.0)
    collectSound.volume = 0.8;
    gameOverSound.volume = 0.8;
    startSound.volume = 0.8;


    // --- GRÖSSENANPASSUNG ---
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // --- KLASSEN (SPIELOBJEKTE) ---
    class Star {
        constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.size = Math.random() * 2; this.speed = this.size * 0.5; }
        update() { this.y += this.speed; if (this.y > height) { this.y = 0; this.x = Math.random() * width; } }
        draw() { ctx.fillStyle = 'white'; ctx.fillRect(this.x, this.y, this.size, this.size); }
    }

    class Player {
        constructor() { this.x = width / 2; this.y = height * 0.8; this.size = 40; }
        draw() {
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
        constructor() { this.x = Math.random() * width; this.y = -20; this.size = 20 + Math.random() * 40; this.speed = 2 + Math.random() * 3; }
        update() { this.y += this.speed; }
        draw() { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }

    class Crystal {
        constructor() { this.x = Math.random() * width; this.y = -20; this.size = 15; this.speed = 3; }
        update() { this.y += this.speed; }
        draw() { ctx.fillStyle = '#00FF7F'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }

    // --- SPIELFUNKTIONEN ---
    function initGame() {
        resize();
        stars = Array.from({ length: 80 }, () => new Star());
        player = new Player();
        asteroids = [];
        crystals = [];
        score = 0;
    }

    function spawnObjects() {
        if (Math.random() < 0.03) asteroids.push(new Asteroid());
        if (Math.random() < 0.01) crystals.push(new Crystal());
    }

    function update(dt) {
        stars.forEach(s => s.update());
        asteroids.forEach(a => a.update());
        crystals.forEach(c => c.update());

        asteroids = asteroids.filter(a => a.y < height + 50);
        crystals = crystals.filter(c => c.y < height + 50);

        // Kollision mit Asteroiden
        for (let a of asteroids) {
            if (Math.abs(a.x - player.x) < a.size && Math.abs(a.y - player.y) <
