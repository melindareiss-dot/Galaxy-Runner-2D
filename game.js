// Der gesamte Code wird erst ausgeführt, wenn das HTML-Dokument vollständig geladen ist.
document.addEventListener('DOMContentLoaded', () => {
    
    // VARIABLEN UND KONSTANTEN
    const canvas=document.getElementById('gameCanvas');
    const ctx=canvas.getContext('2d');
    const overlay=document.getElementById('overlay');
    const scoreDisplay=document.getElementById('score');

    let width,height,running=false,lastTime=0,score=0;
    let player,stars=[],asteroids=[],crystals=[],shields=[],slows=[];

    // NEUE STATE-VARIABLEN FÜR POWER-UPS
    let shieldActive = false;
    let slowActive = false;
    let slowTimer = 0;
    const POWERUP_DURATION = 5000; // 5 Sekunden
    const BASE_SPEED_SCALE = 1;

    // SOUND-INITIALISIERUNG
    // Hinweis: Web-Audio muss meistens durch eine Benutzerinteraktion gestartet werden (hier: startGame)
    let powerupSound;
    try {
        powerupSound = new Audio('audio/powerup.mp3'); // Annahme: Du fügst eine Sounddatei hinzu
        powerupSound.volume = 0.5;
    } catch (e) {
        console.log("Audio API nicht verfügbar oder Fehler beim Laden des Sounds.");
    }
    
    function playPowerupSound() {
        if (powerupSound) {
            powerupSound.play().catch(e => console.log("Sound konnte nicht abgespielt werden:", e));
        }
    }

    function resize(){
      width=canvas.width=window.innerWidth;
      height=canvas.height=window.innerHeight;
    }
    window.addEventListener('resize',resize);
    resize();

    // KLASSEN
    class Star{
      constructor(){this.x=Math.random()*width;this.y=Math.random()*height;this.size=Math.random()*2;this.speed=this.size*0.5;}
      update(speedScale = BASE_SPEED_SCALE){this.y+=this.speed * speedScale;if(this.y>height){this.y=0;this.x=Math.random()*width;}}
      draw(){ctx.fillStyle='white';ctx.fillRect(this.x,this.y,this.size,this.size);}
    }
    class Player{
      constructor(){this.x=width/2;this.y=height*0.8;this.size=40;}
      draw(){
        // Spielerfarbe basierend auf Schild-Status
        ctx.fillStyle= shieldActive ? '#FFD700' : '#00FFFF'; // Gold, wenn Schild aktiv
        ctx.beginPath();
        ctx.moveTo(this.x,this.y-this.size/2);
        ctx.lineTo(this.x-this.size/2,this.y+this.size/2);
        ctx.lineTo(this.x+this.size/2,this.y+this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Schild-Visualisierung hinzufügen
        if (shieldActive) {
            ctx.strokeStyle = '#ADD8E6'; // Hellblau
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 5, this.size * 0.9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
      }
    }
    class Asteroid{
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=20+Math.random()*40;this.speed=2+Math.random()*3;}
      update(speedScale = BASE_SPEED_SCALE){this.y+=this.speed * speedScale;}
      draw(){ctx.fillStyle='#888';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }

    // GRÜNER PUNKT (CRYSTAL) - Zusatzpunkte
    class Crystal{ 
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=15;this.speed=3;}
      update(speedScale = BASE_SPEED_SCALE){this.y+=this.speed * speedScale;}
      draw(){ctx.fillStyle='#00FF7F';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }
    
    // BLAUER PUNKT (SHIELD) - Unverwundbarkeit
    class Shield{ 
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=15;this.speed=3;}
      update(speedScale = BASE_SPEED_SCALE){this.y+=this.speed * speedScale;}
      draw(){ctx.fillStyle='#00BFFF';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }
    
    // LILA PUNKT (SLOW) - Zeitlupe
    class Slow{ 
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=15;this.speed=3;}
      update(speedScale = BASE_SPEED_SCALE){this.y+=this.speed * speedScale;}
      draw(){ctx.fillStyle='#8A2BE2';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }


    // SPIELFUNKTIONEN
    function initGame(){
      resize();
      stars=Array.from({length:80},()=>new Star());
      player=new Player();
      asteroids=[];crystals=[];shields=[];slows=[];score=0;
      shieldActive = false;
      slowActive = false;
    }

    function spawnObjects(){
      // Wahrscheinlichkeiten
      const ASTEROID_SPAWN_CHANCE = 0.03;
      const CRYSTAL_SPAWN_CHANCE = 0.01;
      const SHIELD_SPAWN_CHANCE = 0.002; // Seltener
      const SLOW_SPAWN_CHANCE = 0.002; // Seltener

      if(Math.random()<ASTEROID_SPAWN_CHANCE)asteroids.push(new Asteroid());
      if(Math.random()<CRYSTAL_SPAWN_CHANCE)crystals.push(new Crystal());
      if(Math.random()<SHIELD_SPAWN_CHANCE)shields.push(new Shield());
      if(Math.random()<SLOW_SPAWN_CHANCE)slows.push(new Slow());
    }

    function update(dt){
      // Geschwindigkeitsskalierung berechnen
      const speedScale = slowActive ? 0.3 : BASE_SPEED_SCALE; // 30% der normalen Geschwindigkeit

      // Timer für Slow-Motion verwalten
      if (slowActive) {
          slowTimer -= dt;
          if (slowTimer <= 0) {
              slowActive = false;
          }
      }

      stars.forEach(s=>s.update(speedScale));
      asteroids.forEach(a=>a.update(speedScale));
      crystals.forEach(c=>c.update(speedScale));
      shields.forEach(s=>s.update(speedScale));
      slows.forEach(s=>s.update(speedScale));
      
      asteroids=asteroids.filter(a=>a.y<height+50);
      crystals=crystals.filter(c=>c.y<height+50);
      shields=shields.filter(s=>s.y<height+50);
      slows=slows.filter(s=>s.y<height+50);


      // KOLLISIONEN
      
      // 1. Asteroiden-Kollision
      for(let a of asteroids){
        if(Math.abs(a.x-player.x)<a.size && Math.abs(a.y-player.y)<a.size){
          if (shieldActive) {
              // Wenn Schild aktiv, Asteroid entfernen, kein Game Over
              asteroids.splice(asteroids.indexOf(a), 1); 
              shieldActive = false; // Schild verlieren
              continue; 
          }
          
          // Game Over (wenn kein Schild aktiv)
          running=false;
          overlay.style.display='flex';
          overlay.innerHTML=`<h1>💥 Game Over!</h1><p>Score: ${Math.floor(score)}</p><p>Tippe, um erneut zu starten!</p>`;
          return;
        }
      }
      
      // 2. Kristall (Grüner Punkt) Kollision
      crystals.forEach((c,i)=>{
        if(Math.abs(c.x-player.x)<c.size && Math.abs(c.y-player.y)<c.size){
          crystals.splice(i,1);score+=10;
          playPowerupSound(); // Sound beim Einsammeln
        }
      });
      
      // 3. Schild (Blauer Punkt) Kollision
      shields.forEach((s,i)=>{
        if(Math.abs(s.x-player.x)<s.size && Math.abs(s.y-player.y)<s.size){
          shields.splice(i,1);
          shieldActive = true;
          // Schild-Timer (visueller Indikator)
          setTimeout(() => {
              if (running) shieldActive = false;
          }, POWERUP_DURATION);
          playPowerupSound();
        }
      });
      
      // 4. Zeitlupe (Lila Punkt) Kollision
      slows.forEach((s,i)=>{
        if(Math.abs(s.x-player.x)<s.size && Math.abs(s.y-player.y)<s.size){
          slows.splice(i,1);
          slowActive = true;
          slowTimer = POWERUP_DURATION;
          playPowerupSound();
        }
      });


      score+=dt*0.05;
      scoreDisplay.textContent=`SCORE: ${Math.floor(score)}`;
    }

    function draw(){
      ctx.clearRect(0,0,width,height);
      stars.forEach(s=>s.draw());
      player.draw();
      asteroids.forEach(a=>a.draw());
      crystals.forEach(c=>c.draw());
      shields.forEach(s=>s.draw()); // Blaue Punkte zeichnen
      slows.forEach(s=>s.draw()); // Lila Punkte zeichnen
      
      // Visualisierung für Slow-Motion
      if (slowActive) {
          ctx.fillStyle = `rgba(138, 43, 226, 0.2)`; // Lila Überlagerung
          ctx.fillRect(0, 0, width, height);
      }
    }

    function loop(timestamp){
      if(!running)return;
      const dt=timestamp-lastTime;lastTime=timestamp;
      spawnObjects();update(dt);draw();
      requestAnimationFrame(loop);
    }

    function startGame(){
      // Versuch, Audio hier zu initialisieren/starten, da es die erste Benutzeraktion ist
      playPowerupSound(); 
      if (powerupSound) powerupSound.pause(); // Wir wollen es nicht direkt beim Start hören
      
      overlay.style.display='none';
      initGame();running=true;
      lastTime=performance.now();
      requestAnimationFrame(loop);
    }

    // STEUERUNG UND EVENTS (Finaler iOS-Fix)
    function movePlayer(x,y){player.x=x;player.y=y;}
    canvas.addEventListener('touchmove',e=>{
      const t=e.touches[0];movePlayer(t.clientX,t.clientY);
    });
    canvas.addEventListener('mousemove',e=>{
      if(e.buttons)movePlayer(e.clientX,e.clientY);
    });
    
    // VERBESSERTE START-LISTENER: Konzentriert sich auf touchend/click und verhindert Standard-Aktionen
    overlay.addEventListener('touchstart', e => {
        e.preventDefault(); 
    });
    overlay.addEventListener('touchend', e => {
        e.preventDefault(); 
        startGame();
    });
    overlay.addEventListener('click', e => {
        e.preventDefault();
        startGame();
    });

}); // Ende von document.addEventListener('DOMContentLoaded')