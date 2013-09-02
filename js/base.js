debug = false;
bounds = [[0,1000],[0,600]];
/*
 * Basecode for a js game
 * With strong inspiration from http://blog.sklambert.com/html5-canvas-game-panning-a-background/
 */
/**
 * Storage for all images
 */
var imageRepository;
var imagesLoaded;
imageRepository = new function() {
    var imagesLoaded = 0;
    var totalImages = 4;

    function imageLoaded(){
        imagesLoaded++;
        if( imagesLoaded === totalImages){
            if(debug){
                console.log("Images loaded");
            }
            if(game.init()){
                game.start();
            }
        }
    }

    this.background = new Image();
    //this.bullet = new Image();
    //this.bullet_straight = new Image();
    //this.bullet_diag = new Image();
    this.bullets = new Image();
    this.playerSprite = new Image();
    this.dunes = new Image();

    this.background.onload = imageLoaded;
    //this.bullet.onload = imageLoaded;
    //this.bullet_straight.onload = imageLoaded;
    //this.bullet_diag.onload = imageLoaded;
    this.bullets.onload = imageLoaded;
    this.playerSprite.onload = imageLoaded;
    this.dunes.onload = imageLoaded;

    this.background.src = "img/bg1.png";
    this.bullets.src = "img/bullets_sheet.png";
    //this.bullet.src = "img/bullet1.png";
    //this.bullet_straight.src = "img/bullet2.png";
    //this.bullet_diag.src = "img/bullet3.png";
    this.playerSprite.src = "img/ship_sheet.png";
    this.dunes.src = "img/dunes.png";
}

/** 
 * Base entity for an object that can be rendered
 */
function Drawable() {
    this.init = function(_x, _y, _width, _height, _canvas) {
        this.position = {
            x : _x,
            y : _y
        };
        this.screen = {
            context : _canvas.getContext('2d'),
            //width : _canvas.width,
            //height: _canvas.height
            width : _width,
            height : _height
        };
        //in case drawing and collision dimensions aren't the same
        this.width = _width;
        this.height = _height;
    };
    this.speed = {
        x:0,
        y:0
    };
    //this.canvasWidth = 0;
    //this.canvasHeight = 0;

    this.clean = function() {
    };
    this.draw = function() {
    };
}
/*
 * Object pool for bullets &c
 */
function Pool(maxSize) {
    var size = maxSize;
    var pool = [];

    this.init = function(context) {
        for (var i = 0; i < size; i++) {
            var bullet = new Bullet();
            bullet.init(0,0,16, 16,context);
            pool[i] = bullet;
        }
    };
    this.get = function(x, y,speed, type) {
        if(!pool[size - 1].alive) {
            pool[size - 1].spawn(x, y, speed,type);
            pool.unshift(pool.pop());
        }
    };
    this.animate = function() {
        //clean first to avoid deleting other bullets
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                pool[i].clean();
            }else break;
        }
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    pool[i].clear();
                    pool.push((pool.splice(i,1))[0]);
                }
            }
            else break;
        }
    };
    this.clear = function() {
        for (var i = 0; i < size; i++) {
            if (pool[i].alive){
                pool[i].clear();
                pool.push((pool.splice(i,1))[0]);
            }else break;
        }
    };
}

/*
 * Use the available version of requestAnimationFrame
 * http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
requestAnimationFrame =
window.requestAnimationFrame || // According to the standard
window.mozRequestAnimationFrame || // For mozilla
window.webkitRequestAnimationFrame || // For webkit
window.msRequestAnimationFrame || // For ie
function (f) { window.setTimeout(function () { f(Date.now()); }, 1000/60); }; // If everthing else fails


/*
 * Background
 */
function Background() {
    this.speed.x = 0;
    this.speed.y = 0;
    this.img = imageRepository.background;
    this.draw = function() {
        this.position.x += this.speed.x;
        this.position.y += this.speed.y;
       //context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
       /**
       try{
           var cropx = this.screen.context.canvas.width - this.position.x;
           cropx = Math.min(cropx, this.screen.width);
           var cropy = this.screen.context.canvas.height - this.position.y;
           cropy = Math.min(cropx, this.screen.height);
           this.screen.context.drawImage(this.img,0,0, cropx, cropy,this.position.x, this.position.y, cropx,cropy);
           //console.log(this.img+" "+0+" "+0+" "+ cropx+" "+ cropy+" "+this.position.x+" "+ this.position.y+" "+ cropx+" "+cropy);

       }catch(err){
        console.log(err);
       }
       */
       this.screen.context.drawImage(this.img, this.position.x,this.position.y);
       //manage scrolling
        if(this.speed.y > 0){
            this.screen.context.drawImage(this.img, this.position.x, this.position.y - this.screen.height);
            if (this.position.y >= this.screen.height){
                this.position.y = 0;
            }
        }else if(this.speed.x < 0){
            this.screen.context.drawImage(this.img, this.position.x + this.screen.width, this.position.y);
            if (this.position.x <= -this.screen.width){
                this.position.x = 0;
            }
        }
    };
}
Background.prototype = new Drawable();

/*
 * Player character
 */
function Player() {
    this.speed.x = 0;
    this.speed.y = 0;
    this.moved = true;
    this.hit = false;
    this.maxfuel = 80;
    this.fuel = this.maxfuel;
    this.boosting = false;
    this.charged = false;
    this.frame = 0;
    this.frameT = 0;
    this.clean = function() {
        //ship
            this.screen.context.clearRect(this.position.x - 2, this.position.y - 2, this.screen.width + 2, this.screen.height + 2);
            //fire
            this.screen.context.clearRect(this.position.x - 16, this.position.y+7, 16,16);
    };
    this.draw = function() {
        //don't change real values until checking the final result
        var vx = this.speed.x;
        //var vy = this.speed.y;
        var vy = 0;
        var x = this.position.x;
        var y = this.position.y;
        if (Key.isDown(Key.SPACE) && ((this.fuel > 0) && ((this.fuel >= this.maxfuel) || this.boosting))){
            this.boosting = true;
            this.fuel--;
            if (vx < 12){
                vx += 0.4;
            }
        }else{
            this.boosting = false;
            if(this.fuel < this.maxfuel){
                this.fuel += 0.3;
                if (this.fuel >= this.maxfuel){
                    this.charged = true;
                    this.frameT = 0;
                    this.frame = 0;
                    this.fuel = this.maxfuel;
                }
            }
            if (Key.isDown(Key.LEFT)){
                if (vx > -5.5){
                    vx -= 0.5;
                }
            }else{
                if (vx < 0.0){
                    vx += 0.8;
                }
            }
            if (Key.isDown(Key.RIGHT)){
                if (vx < 5.5){
                    vx += 0.5;
                }
            }else{
                if (vx > 0.00){
                    vx -= 0.8;
                }
            }
        }
        if (Key.isDown(Key.DOWN)){
            if(y < 517){
                vy = 3;
            }
        }
        if (Key.isDown(Key.UP)){
            if(y>3){
                vy = -3;
            }
        }
        if ((x + vx  < bounds[0][0]) || (x + vx + this.screen.width  > bounds[0][1])){
            vx = 0;
        }
        if ((vx >= -0.04 && vx <= 0.04)){
            vx = 0;
        }
        x = x + vx;
        y = y + vy;
        this.moved = (this.position.x != x) || (this.position.y != y);

        this.speed.x = vx;
        this.speed.y = vy;

        //draw only if position has changed
        //if (this.moved) {
            this.position.x = x;
            this.position.y = y;
        //}
           //draw only on integer positions to avoid smoothing
           x = (x + 0.5)|0;
           y = (y + 0.5)|0;
           if(this.charged && this.frame == 2){
               this.charged = false;
               this.frame = 0;
               this.frameT = 0;
           }
           if(this.charged){
              this.frameT++;
              if(this.frameT >= 20){
                  this.frame = (this.frame + 1) % 4;
                  this.frameT = 0;
              }
              this.screen.context.drawImage(imageRepository.playerSprite,48,32 + this.frame * 32,48,32, this.position.x,this.position.y,48,32);
           }else{
               this.frameT = this.frameT++;
               if(this.frameT >= 20){
                   this.frame = (this.frame + 1) % 4;
               }
               //context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
               if(vy > 0){
                    this.screen.context.drawImage(imageRepository.playerSprite,48*2,0,48,32, this.position.x,this.position.y,48,32);
               }else if(vy < 0){
                    this.screen.context.drawImage(imageRepository.playerSprite,48*3,0,48,32, this.position.x,this.position.y,48,32);
               }else{
                    this.screen.context.drawImage(imageRepository.playerSprite,48,0,48,32, this.position.x,this.position.y,48,32);
               }
               //fire
               var xpixel = (this.frame % 2)*16;
               var ypixel = 16 * ((this.frame / 2)|0);
               if( this.boosting){
                    this.screen.context.drawImage(imageRepository.playerSprite,xpixel,32+ypixel,16,16, this.position.x-6,this.position.y+7,16,16);
               }else{
                    this.screen.context.drawImage(imageRepository.playerSprite,xpixel,ypixel,16,16, this.position.x,this.position.y+7,16,16);
               }
           }
           if(debug){
               this.screen.context.strokeStyle = "white";
               this.screen.context.strokeRect(this.position.x, this.position.y,this.width,this.height);
           }
    };
    this.reset = function(){
        this.speed.x = 0;
        this.speed.y = 0;
        this.moved = true;
        this.hit = false;
        this.screen.context.clearRect(this.position.x, this.position.y, this.screen.width, this.screen.height);
        this.fuel = this.maxfuel;
        //this.position = game.stage.playerPosition;
    };
        
}
Player.prototype = new Drawable();

/*
 * Bullet
 */


function Bullet() {
    this.alive = false; //not in use

    this.spawn = function(x, y, speed,type){
        this.position.x = x;
        this.position.y = y;
        this.speed = speed;
        this.alive = true;
        this.type = type;
        switch(type){
            case BulletType.STRAIGHT: 
                this.width = 16;
                this.height = 16;
                this.screen.width = 16;
                break;
            case BulletType.SIN: 
                this.width = 16;
                this.height = 16;
                this.screen.width = 16;
                this.screen.height = 16;
                break;
            case BulletType.DIAG: 
                this.width = 16;
                this.height = 16;
                this.screen.width = 16;
                this.screen.height = 16;
                break;
            case BulletType.ROT:
                this.width = 32;
                this.height = 32;
                this.screen.width = 32;
                this.screen.height = 32;
                break;
            case BulletType.BALL:
                this.width = 32;
                this.height = 32;
                this.screen.width = 32;
                this.screen.height = 32;
                break;
        }
    };

    this.clean = function() {
        switch(this.type){
            case BulletType.STRAIGHT: 
                this.screen.context.clearRect(this.position.x - 1,this.position.y - 1, this.screen.width + 1, this.screen.height + 1);
                break;
            case BulletType.SIN: 
                this.screen.context.clearRect(this.position.x - 1,this.position.y - 1, this.screen.width + 1, this.screen.height + 1);
                break;
            case BulletType.DIAG: 
                this.screen.context.clearRect(this.position.x - 1,this.position.y - 1, this.screen.width + 1, this.screen.height + 1);
                break;
            case BulletType.ROT:
                this.screen.context.clearRect(this.position.x - 1,this.position.y - 1, this.screen.width + 1, this.screen.height + 1);
                this.screen.context.clearRect(this.position.x+100*Math.cos(this.position.x/64)-1, this.position.y+100*Math.sin(this.position.x/64)-1,34,34);
                break;
            case BulletType.BALL:
                this.screen.context.clearRect(this.position.x - 1,this.position.y - 1, this.screen.width + 1, this.screen.height + 1);
                break;
            }
    };
    this.draw = function() {
        switch(this.type){
            case BulletType.STRAIGHT: 
                this.position.x += this.speed.x;
                this.position.y += this.speed.y;
                break;
            case BulletType.SIN: 
                this.position.x += this.speed.x;
                this.position.y += 4 * Math.sin(this.position.x/128);
                break;
            case BulletType.DIAG: 
                this.position.x += this.speed.x;
                this.position.y += -this.speed.x/3;
                break;
            case BulletType.ROT:
                this.position.x += this.speed.x;
                break;
            case BulletType.BALL:
                this.position.x += this.speed.x;
                break;
            }
        //out of the screen
        if ((this.position.y <= 0 - this.screen.height) || (this.position.x <= 0 - this.screen.width)){
            return true;
        }else{
            var x,y;
            if(this.position.x > 0){
                x = (this.position.x + 0.5)|0;
            }else{
                x = (this.position.x - 0.5)|0;
            }
            if(this.position.y > 0){
                y = (this.position.y + 0.5)|0;
            }else{
                y = (this.position.y - 0.5)|0;
            }
            var img = imageRepository.bullets;
            switch(this.type){
                case BulletType.STRAIGHT: 
                    this.screen.context.drawImage(img,16,0,16,16, x, y,16,16);
                    break;
                case BulletType.SIN: 
                    this.screen.context.drawImage(img,0,0,16,16, x, y,16,16);
                    break;
                case BulletType.DIAG: 
                    this.screen.context.drawImage(img,32,0,16,16, x, y,16,16);
                    break;
                case BulletType.ROT:
                    this.screen.context.drawImage(img,80,0,32,32, this.position.x + 100*Math.cos(x/64), this.position.y+100*Math.sin(x/64),32,32);
                    break;
                case BulletType.BALL:
                    this.screen.context.drawImage(img,48,0,32,32, x, y,32,32);
                    break;
                }
        }
        var playerX = game.player.position.x;
        var playerY = game.player.position.y;
        var playerW = game.player.width;
        var playerH = game.player.height;
        var x = this.position.x;
        var y = this.position.y;
        var w = this.width;
        var h = this.height;
        //check for collisions with player
        if(this.alive && (x < playerX + playerW && x + w > playerX && y < playerY + playerH && y + h > playerY)){
            //AABB collide, check pixels
            var xMin = Math.max( 0,x, playerX );
            var yMin = Math.max( 0,y, playerY );
            var xMax = Math.min( 1000,x+w, playerX + playerW );
            var yMax = Math.min( 600,y+h, playerY + playerH );
            var xDiff = xMax - xMin;
            var yDiff = yMax - yMin;
            //collision box (x = xMin,y = yMin, w = xDiff, h = yDiff)
            x = xMin;
            y = yMin;
            w = xDiff;
            h = yDiff;
            var collide = false;
            var done = false;
            var data1 = this.screen.context.getImageData(x,y,w,h);
            var data2 = game.player.screen.context.getImageData(x,y,w,h);
            x = 0;
            y = 0;
            //pixel-level colission
            //check only 1 out of 2 the border's pixels: x _ x _ ...
            //vertical
            for(var i = 0; i < w; i += 2){
                if((data1.data[i*4+3] & data2.data[i*4+3]) ||
                        (data1.data[data1.data.length - i*4] & data2.data[data2.data.length - i * 4])){
                            collide = true;
                            break;
                        }
            }
            //horizontal
            //0,0 is checked twice, but better than making specific cases if size is odd 
            if(!collide){
                for(var i = 0; i < h; i += 2){
                    if((data1.data[i*width*4+3] & data2.data[i*width*4+3]) ||
                            (data1.data[(i+1)*width*4-1] & data2.data[(i+1)*width*4-1])){
                                collide = true;
                                break;
                            }
                }
            }
            //for(var i = 0; i < data1.data.length; i += 4){
            //    if(data1.data[i+3] & data2.data[i+3]){
            //        collide = true;
            //        break;
            //    }
            //}
            game.player.hit = collide;
        }
           if(debug){
               this.screen.context.strokeStyle = "white";
               this.screen.context.strokeRect(this.position.x, this.position.y,this.width,this.height);
           }
    };

    this.clear = function() {
        //dirty rectangle
        if (this.position.x + this.screen.width > bounds[0][0] || this.position.y + this.screen.height < bounds[1][1]){
            this.screen.context.clearRect(this.position.x-1,this.position.y-1, this.screen.width+1, this.screen.height+1);
        }
        this.position.x = 0;
        this.position.y = 0;
        this.speed.x = 0;
        this.speed.y = 0;
        this.alive = false;
    };
}
Bullet.prototype = new Drawable();

function Stage(){
   this.position= {
       x: 0,
       y: 0
   };
   this.speed = {
       x: 0,
       y: 0
   };
   this.playerPosition = {
       x: 10,
       y: 300
   };
   this.init = function(context) {
        this.shoots = new Pool(100);
        this.shoots.init(context);
        this.time = 10;
        this.lastT = (new Date()).getTime();
       game.player.position.x = this.playerPosition.x;
       game.player.position.y = this.playerPosition.y;
       this.load(0);
   };
   this.load = function(number) {
       this.index = 0;
       this.speed.x = Stages[number].speed.x;
       this.speed.y = Stages[number].speed.y;
       this.data = [];
       for ( var i = 0; i < Stages[number].content.length; i++){
           this.data[i]=[];
           this.data[i][0] = Stages[number].content[i][0] * 60 * this.speed.x;
           this.data[i][1] = Stages[number].content[i][1];
           this.data[i][2] = Stages[number].content[i][2];
       }
   };
   this.update = function() {
       var now = (new Date()).getTime();
       this.time -= (now - this.lastT)/1000; 
       this.lastT = now;
       /**
       if (this.time <= 0){
           //restart
           this.time = 10;
       }
       */
       this.position.x += this.speed.x;
       this.position.y += this.speed.y;
       while( this.index < this.data.length && this.data[this.index][0] <= this.position.x){
           this.shoots.get(1000,this.data[this.index][1],{x:-6,y:0},this.data[this.index][2]);
           this.index++;
       }

       /**
       if(Math.random() > 0.90){
           this.shoots.get(1000,this.y,{x:-1*(Math.random()*7)|0,y:0});
       }
       */
       this.shoots.animate();
   };
   this.reset = function(){
       this.y = 0;
       this.time = 10;
       this.lastT = (new Date()).getTime();
       this.shoots.clear();
       game.player.position.x = this.playerPosition.x;
       game.player.position.y = this.playerPosition.y;
       this.position.x = 0;
       this.position.y = 0;
       this.load(0);
   };
}
function Game() {
    this.init = function() {
        this.bgCanvas = document.getElementById('background');
        this.frontCanvas = document.getElementById('front');
        this.playerCanvas = document.getElementById('player');
        this.uiCanvas = document.getElementById('ui');

        //canvas support
        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.frontContext = this.frontCanvas.getContext('2d');
            this.playerContext = this.playerCanvas.getContext('2d');
            this.uiContext = this.uiCanvas.getContext('2d');
            this.uiContext.font = '30px Arial';
            this.uiContext.fillStyle = '#9090CC';
            //prepare background
            //Background.prototype.context = this.bgContext;
            //Background.prototype.canvasWidth = this.bgCanvas.width;
            //Background.prototype.canvasHeight = this.bgCanvas.height;

            this.background = new Background();
            this.background.init(0,0,1000,600,this.bgCanvas);
            this.dunes = new Background();
            this.dunes.init(0,540,3200,80,this.bgCanvas);
            this.background.speed ={x: -3, y:0};
            this.dunes.speed ={x: -12, y: 0};
            this.dunes.img = imageRepository.dunes;
            //this.background.speed.x = 3;
            this.player = new Player();
            //this.player.init(0,0,imageRepository.playerSprite.width,imageRepository.playerSprite.height,this.playerCanvas);
            this.player.init(0,0,48,32,this.playerCanvas);

            this.stage = new Stage();
            this.stage.init(this.frontCanvas);
            return true;
        }else{
            if(debug){
                console.log("Canvas not supported/available");
            }
            return false;
        }
    };
    this.start = function() {
        animate();
    };
}

function animate() {
    requestAnimationFrame( animate );
    game.background.draw();
    game.dunes.draw();
    game.player.clean();
    game.player.draw();
    game.stage.update();
    //game.uiContext.fillStyle = '#9090CC';
    var countdown = 10 - (game.stage.time | 0);
    game.uiContext.clearRect(800,0,120,60);
    game.uiContext.fillStyle = 'rgb(' + (144 + countdown *10)+',144,204)';
    game.uiContext.font = 30 + 2 * countdown + 'px Arial';
    game.uiContext.fillText(game.stage.time.toFixed(2),800,40+countdown);
    /*
    game.uiContext.fillStyle = '#400404';
    game.uiContext.fillRect(200, 45, 120, 40);
    game.uiContext.fillStyle = '#902020';
    game.uiContext.fillRect(200, 50, game.player.fuel, 30);
    */
    if(game.player.hit || game.stage.time < 0){
        //died, reset stage
        game.player.reset();
        game.stage.reset();
    }
}

var game = new Game();
