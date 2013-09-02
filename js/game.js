
bounds = [[0,800],[0,600]];
size = [32,32];
FPS = 60;
pos = [0,0];
vel = [0,0];
hy = bounds[1][1]-32;
sprite_index = 0;
anim_time = 0;
//FPS
var filterStrength = 20;
var frameTime = 0;
loop = function() {
  var x = pos[0];
  var y = pos[1];
  var vx = vel[0];
  var vy = vel[1];
  var now = (new Date()).getTime();
  //if ((now - last) > 1000/FPS) console.log("too long");
  //real frames that have passed
  var t = (now - last)/(1000/60);
  frameTime += (now - last - frameTime) / filterStrength;
  //document.getElementById('fps').innerHTML = (1000/frameTime).toFixed(2);
  last = now;
  if ( vy != 0 || y < hy){
      if (vy < -2 && Key.isDown(Key.UP)){
          vy += 0.0625;
      }else{
          if (vy < 4.3125){
              vy += 0.3125;
          }
      }
  }
  if (y > hy){
      y = hy + 1;
      vy = 0;
  }
  if (Key.isDown(Key.UP)){
      if ((vy == 0) && (y == hy + 1)){
          vy = -3.4375;
      }
  }
      
  if (Key.isDown(Key.LEFT)){
      if (vx > -2.5){
          vx -= 0.05;
      }
  }else{
      if (vx < 0.04){
          vx += 0.05;
      }
  }
  if (Key.isDown(Key.DOWN)){
      y++;
  }
  if (Key.isDown(Key.RIGHT)){
      if (vx < 2.5){
          vx += 0.05;
      }
  }else{
      if (vx > 0.04){
          vx -= 0.05;
      }
  }
  if ((x + vx * t < bounds[0][0]) || (x + vx * t + size[1] > bounds[0][1])){
      vx = 0;
  }
  if ((vx >= -0.04 && vx <= 0.04)){
      vx = 0;
  }
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(x,y,32,32);
  x = x + vx*t;
  y = y + vy*t;
  pos[0] = x;
  pos[1] = y;
  vel[0] = vx;
  vel[1] = vy;
  //round to integer
  x = x|0;
  y = y|0;
  //ctx.drawImage(bg,0,0);
  //
  //var color = Math.floor(Math.random() * 0xffffff).toString(16);
  //ctx.fillStyle =  '#000000'.slice(0, -color.length) + color;
  //ctx.fillStyle =  '#338833';
  //ctx.fillRect(x,y,16,16);
  if(vx == 0) {
      if (vy==0){
          anim_time++;
          if( anim_time > FPS / 6){ //animate at 6 fps
              sprite_index = (sprite_index + 1) % 8;
              anim_time = 0;
          }
          ctx.drawImage(sprite,32*sprite_index,0,32,32,x,y,32,32);
      }else if(vy <0) {
          ctx.drawImage(sprite,0,96,32,32,x,y,32,32);
      }else{
          ctx.drawImage(sprite,0,128,32,32,x,y,32,32);
          //console.log("nope");
          //ctx.strokeRect(x,y,32,32);
      }
  }else if(vx < 0) {
    ctx.drawImage(sprite,0,64,32,32,x,y,32,32);
  }else{
    ctx.drawImage(sprite,0,32,32,32,x,y,32,32);
  }
  requestAnimationFrame(loop);
};
var start = function() {
    img_loaded++;
    if (img_loaded == 2){
        console.log("Images loaded");
        background.getContext("2d").drawImage(bg,0,0);
        //intervalId = setInterval(loop, 1000/FPS);
        last = (new Date()).getTime();
        loop();
    }else console.log("Loading images...");
};
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
img_loaded = 0;
bg = new Image();
bg.onload = start;
bg.src = "img/bg1.png";
sprite = new Image();
sprite.onload = start;
sprite.src = "img/blob.png";
