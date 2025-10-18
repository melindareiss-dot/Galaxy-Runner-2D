// Der gesamte Code wird erst ausgeführt, wenn das HTML-Dokument vollständig geladen ist.
document.addEventListener('DOMContentLoaded', () => {
    
    // ALLE DEINE ORIGINALEN VARIABLEN UND FUNKTIONEN STARTEN HIER
    const canvas=document.getElementById('gameCanvas');
    const ctx=canvas.getContext('2d');
    const overlay=document.getElementById('overlay');
    const scoreDisplay=document.getElementById('score');

    let width,height,running=false,lastTime=0,score=0;
    let player,stars=[],asteroids=[],crystals=[];

    function resize(){
      width=canvas.width=window.innerWidth;
      height=canvas.height=window.innerHeight;
    }
    window.addEventListener('resize',resize);
    resize();

    class Star{
      constructor(){this.x=Math.random()*width;this.y=Math.random()*height;this.size=Math.random()*2;this.speed=this.size*0.5;}
      update(){this.y+=this.speed;if(this.y>height){this.y=0;this.x=Math.random()*width;}}
      draw(){ctx.fillStyle='white';ctx.fillRect(this.x,this.y,this.size,this.size);}
    }
    class Player{
      constructor(){this.x=width/2;this.y=height*0.8;this.size=40;}
      draw(){
        ctx.fillStyle='#00FFFF';
        ctx.beginPath();
        ctx.moveTo(this.x,this.y-this.size/2);
        ctx.lineTo(this.x-this.size/2,this.y+this.size/2);
        ctx.lineTo(this.x+this.size/2,this.y+this.size/2);
        ctx.closePath();
        ctx.fill();
      }
    }
    class Asteroid{
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=20+Math.random()*40;this.speed=2+Math.random()*3;}
      update(){this.y+=this.speed;}
      draw(){ctx.fillStyle='#888';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }
    class Crystal{
      constructor(){this.x=Math.random()*width;this.y=-20;this.size=15;this.speed=3;}
      update(){this.y+=this.speed;}
      draw(){ctx.fillStyle='#00FF7F';ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
    }

    function initGame(){
      resize(); // Erneute Sicherheitsprüfung der Größe
      stars=Array.from({length:80},()=>new Star());
      player=new Player();
      asteroids=[];crystals=[];score=0;
    }

    function spawnObjects(){
      if(Math.random()<0.03)asteroids.push(new Asteroid());
      if(Math.random()<0.01)crystals.push(new Crystal());
    }

    function update(dt){
      stars.forEach(s=>s.update());
      asteroids.forEach(a=>a.update());
      crystals.forEach(c=>c.update());
      asteroids=asteroids.filter(a=>a.y<height+50);
      crystals=crystals.filter(c=>c.y<height+50);

      for(let a of asteroids){
        if(Math.abs(a.x-player.x)<a.size && Math.abs(a.y-player.y)<a.size){
          running=false;
          overlay.style.display='flex';
          overlay.innerHTML=`<h1>💥 Game Over!</h1><p>Score: ${Math.floor(score)}</p><p>Tippe, um erneut zu starten!</p>`;
          return;
        }
      }
      crystals.forEach((c,i)=>{
        if(Math.abs(c.x-player.x)<c.size && Math.abs(c.y-player.y)<c.size){
          crystals.splice(i,1);score+=10;
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
    }

    function loop(timestamp){
      if(!running)return;
      const dt=timestamp-lastTime;lastTime=timestamp;
      spawnObjects();update(dt);draw();
      requestAnimationFrame(loop);
    }

    // Steuerung für Touch und Klick
    function movePlayer(x,y){player.x=x;player.y=y;}
    canvas.addEventListener('touchmove',e=>{
      const t=e.touches[0];movePlayer(t.clientX,t.clientY);
    });
    canvas.addEventListener('mousemove',e=>{
      if(e.buttons)movePlayer(e.clientX,e.clientY);
    });
    
    // Event-Listener für StartGame
    overlay.addEventListener('touchstart',startGame);
    overlay.addEventListener('click',startGame);

    function startGame(){
      overlay.style.display='none';
      initGame();running=true;
      lastTime=performance.now();
      requestAnimationFrame(loop);
    }

}); // Ende von document.addEventListener('DOMContentLoaded')
