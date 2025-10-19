document.addEventListener('DOMContentLoaded', () => {
    
    // VARIABLEN UND KONSTANTEN
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const scoreDisplay = document.getElementById('score');

    // --- SOUNDS HINZUGEFÜGT ---
    const startSound = new Audio('https://audio.jukehost.co.uk/GSmTILOxBTpeKHj5qGyiitJLYqVwh6aE');
    const backgroundMusic = new Audio('https://audio.jukehost.co.uk/pYUtckzLOyf3LUrV506FrdtngI0XiPCo');
    const collectSound = new Audio('https://audio.jukehost.co.uk/dDi8yejBQycWwoFRGKY3ttYSftXPWZ2v');
    const gameOverSound = new Audio('https://audio.jukehost.co.uk/xiLuS0OQwACqtvfJn0hNGmoD9rtpaAOh');

    // --- SOUND-EINSTELLUNGEN ---
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    collectSound.volume = 0.8;
    gameOverSound.volume = 0.8;
    startSound.volume = 0.8;
    
    // --- SICHERER START FÜR HINTERGRUNDMUSIK ---
    // Startet die Hintergrundmusik, sobald der Start-Sound zu Ende ist.
    startSound.onended = function() {
        backgroundMusic.play().catch(e => console.error("Hintergrundmusik fehlgeschlagen:", e));
    };

    let width, height, running = false, lastTime = 0, score = 0;
    let player, stars = [], asteroids = [], crystals = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // KLASSEN (wie im Original)
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

    // SPIELFUNKTIONEN (wie im Original, mit Sound-Ergänzungen)
    function initGame() {
      resize();
      stars = Array.from({ length: 80 }, () => new Star());
      player = new Player();
      asteroids = []; crystals = []; score = 0;
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

      for (let a of asteroids) {
        if (Math.abs(a.x - player.x) < a.size && Math.abs(a.y - player.y) < a.size) {
          running = false;
          overlay.style.display = 'flex';
          overlay.innerHTML = `<h1>💥 Game Over!</h1><p>Score: ${Math.floor(score)}</p><p>Tippe, um erneut zu starten!</p>`;
          
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
          gameOverSound.play();
          return;
        }
      }
      crystals.forEach((c, i) => {
        if (Math.abs(c.x - player.x) < c.size && Math.abs(c.y - player.y) < c.size) {
          crystals.splice(i, 1); score += 10;
          
          collectSound.currentTime = 0;
          collectSound.play();
        }
      });
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

    // ORIGINAL-STARTFUNKTION MIT SOUND-ANPASSUNG
    function startGame() {
      overlay.style.display = 'none';
      initGame(); running = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);

      // Nur EINEN Sound direkt beim Klick starten
      startSound.play().catch(e => console.error("Start-Sound fehlgeschlagen:", e));
    }

    // STEUERUNG UND EVENTS (wie im Original)
    function movePlayer(x, y) { player.x = x; player.y = y; }
    canvas.addEventListener('touchmove', e => {
      const t = e.touches[0]; movePlayer(t.clientX, t.clientY);
    });
    canvas.addEventListener('mousemove', e => {
      if (e.buttons) movePlayer(e.clientX, e.clientY);
    });
    
    overlay.addEventListener('touchstart', e => { e.preventDefault(); });
    overlay.addEventListener('touchend', e => { e.preventDefault(); startGame(); });
    overlay.addEventListener('click', e => { e.preventDefault(); startGame(); });

});