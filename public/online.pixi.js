const socket = io(window.location.origin)

socket.on('connect', function() {
  console.log('Connected to server')
})

socket.on('stream', function (data) {
  console.log('stream', data.gameArea)
  game = data.data
  gameArea = data.gameArea
  console.log('Game получен', game.status)
  if (game.status === 'finished') {
    socket.emit('finished')
    setTimeout(() => {
      showBlock('menu')
      hideBlock('gameplay')
      hideBlock('waiting')
    }, 5000)
  }
  console.log(data.id, snakeId)
  document.getElementById('score').innerText = mySnake().level
  document.getElementById('ico-pause').className = game.status === 'paused' ? 'play' : 'pause'
})

socket.on('disconnect', function () {
  console.error('lost connection')
})

let app;
let textureH = PIXI.Texture.from('./snakehead.png');
let textureB = PIXI.Texture.from('./snakebody.png');
let textureT = PIXI.Texture.from('./snaketale.png');
let snakeImg = {
  h: {},
  b: {},
  t: {},
};
let playGame = new PIXI.Container();

const Routes = { 
  UP: 'up', 
  DOWN: 'down', 
  RIGHT: 'right', 
  LEFT: 'left'
}

const Modes = {
  SINGLE: 'single',
  MULTI: 'multi'
}

const keyMap = { 
  ArrowUp: Routes.UP, 
  ArrowDown: Routes.DOWN, 
  ArrowRight: Routes.RIGHT, 
  ArrowLeft: Routes.LEFT
}

const Rotations = {
  [Routes.UP]: 3 * Math.PI / 2,
  [Routes.DOWN]: Math.PI / 2,
  [Routes.RIGHT]: 0,
  [Routes.LEFT]: Math.PI,
};

let game
let gameArea
let snakeId

function pause () {
  if (game.status === 'playing') {
    socket.emit('paused')
  } else if (game.status === 'paused') {
    socket.emit('resumed')
  }
}

function showBlock (selector) {
  document.getElementById(selector).style.display = "block"
}

function hideBlock (selector) {
  document.getElementById(selector).style.display = "none"
}

function init () {
  document.addEventListener('keydown', setNextRoute)
  document.getElementById('pause').addEventListener('click', pause)
  document.getElementById('singlePlayer').addEventListener('click', () => {connectToGame(Modes.SINGLE)})
  document.getElementById('multiPlayer').addEventListener('click', () => {connectToGame(Modes.MULTI)})
  document.getElementById('exit').addEventListener('click', exit)
}

function connectToGame (mode) {
  console.log('Connect to game')
  socket.on('invite', function (data) {
    console.log('invite', data.gameArea)
    game = data.data
    gameArea = data.gameArea
    snakeId = data.id
    console.log(data)
    console.log('invite получен', game.status)
    document.getElementById('score').innerText = mySnake().level
    document.getElementById('ico-pause').className = game.status === 'paused' ? 'play' : 'pause'
    hideBlock('waiting')
    showBlock('gameplay')
    startNewGame()
  })
  socket.emit('requestInvite', {mode})
  hideBlock('menu')
  showBlock('waiting')
}

function exit () {
  console.log('exit')
  socket.emit('exit')
  showBlock('menu')
  hideBlock('gameplay')
}

function startNewGame () {
  console.log('startNewGame')
  app = new PIXI.Application({
    width: 800, 
    height: 600, 
    backgroundColor: 0xE3E3E3,
  });

  document.body.appendChild(app.view);
  



let count = 0;

// build a rope!
const ropeLength = 918 / 20;

const points = [];

for (let i = 0; i < 20; i++) {
    points.push(new PIXI.Point(i * ropeLength, 0));
}

const strip = new PIXI.SimpleRope(PIXI.Texture.from('./snake.png'), points);

strip.x = -459;

const snakeContainer = new PIXI.Container();
snakeContainer.x = 400;
snakeContainer.y = 300;

snakeContainer.scale.set(0.5);
app.stage.addChild(snakeContainer);

snakeContainer.addChild(strip);

app.ticker.add(() => {
    count += 0.1;

    // make the snake
    for (let i = 0; i < points.length; i++) {
        //points[i].x = i * ropeLength + Math.cos((i * 0.3) + count) * 20;
        //points[i].y = Math.sin((i * 0.5) + count) * 30;
        points[i].y = i < 10 ? 0 : 150;
    }
});


  game.snakes.forEach((snake) => {
    snakeImg.h[snake.id] = new PIXI.Sprite(textureH);
    snakeImg.t[snake.id] = new PIXI.Sprite(textureT);
    playGame.addChild(snakeImg.h[snake.id]);
    playGame.addChild(snakeImg.t[snake.id]);
    snakeImg.h[snake.id].anchor.x = 0.5;
    snakeImg.h[snake.id].anchor.y = 0.5;
  })

  app.stage.addChild(playGame);

  console.log(game.snakes)

  app.ticker.add((delta) => {
    game.snakes.forEach((snake) => {
      snakeImg.h[snake.id].x = snake.positionHead.x + 10;
      snakeImg.h[snake.id].y  = snake.positionHead.y + 10;
      snakeImg.h[snake.id].rotation = Rotations[snake.route]
      //drawBody(snake);
    })
  });
}

function setNextRoute (event) {
  if ( ! (event.key in keyMap)) {
    return
  }
  let requestedRoute = keyMap[event.key]
  if (requestedRoute === Routes.UP && mySnake().route === Routes.DOWN) {
    return
  }
  if (requestedRoute === Routes.DOWN && mySnake().route === Routes.UP) {
    return
  }
  if (requestedRoute === Routes.RIGHT && mySnake().route === Routes.LEFT) {
    return
  }
  if (requestedRoute === Routes.LEFT && mySnake().route === Routes.RIGHT) {
    return
  }
  if (game.status === 'playing') socket.emit('setRoute', {requestedRoute, snakeId})
}

function mySnake () {
  return getSnake(snakeId)
}

function getSnake (id) {
  return game.snakes.filter(snake => snake.id === id)[0]
} 

function drawHead (snake) {
  
}

function drawBody (snake) {
  snakeImg.b = {};
  let b = snakeImg.b[snake.id]
  b = []
  if (snake.positionBody.length > 0) {
    while (b.length < snake.positionBody) {
      b.push(new PIXI.Sprite(textureB));
      b[b.length - 1].x = 20;
      b[b.length - 1].y = 20;
      app.stage.addChild(b[b.length - 1]);
    }
    snake.positionBody.forEach((section, i) => {
      b[i].x = section.x;
      b[i].y = section.y;
    })
  }
}

function drawFood () {
  r += dir
  if (r === (gameArea.cell / 2) * 10 + 15 || r === (gameArea.cell / 2) * 10 - 30) dir *= -1
  ctx.beginPath()
  ctx.fillStyle = game.food.color
  ctx.arc(
    game.food.position.x + (gameArea.cell / 2), 
    game.food.position.y + (gameArea.cell / 2), 
    r / 10, 
    0, 
    Math.PI*2
  )
  ctx.closePath()
  ctx.fill()
}
