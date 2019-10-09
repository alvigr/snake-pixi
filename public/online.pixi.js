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

const KeyMap = { 
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

const Velocities = {
  [Routes.UP]: { x: 0, y: -1 },
  [Routes.DOWN]: { x: 0, y: 1 },
  [Routes.RIGHT]: { x: 1, y: 0 },
  [Routes.LEFT]: { x: -1, y: 0 },
};

const socket = io(window.location.origin)

socket.on('connect', function() {
  console.log('Connected to server')
})

socket.on('stream', function (data) {
  //console.log('stream', data.gameArea)
  game = data.data
  gameArea = data.gameArea
  //console.log('Game получен', game.status)
  if (game.status === 'finished') {
    socket.emit('finished')
    setTimeout(() => {
      showBlock('menu')
      hideBlock('gameplay')
      hideBlock('waiting')
    }, 5000)
  }
  //console.log(data.id, snakeId)
  document.getElementById('score').innerText = snake
  document.getElementById('ico-pause').className = game.status === 'paused' ? 'play' : 'pause'
})

socket.on('disconnect', function () {
  console.error('lost connection')
})

let app = new PIXI.Application({
  width: 800, 
  height: 600, 
  backgroundColor: 0xDFEBE0,
});

const snakeH = PIXI.Texture.from('./snakehead.png');
const snakeB = PIXI.Texture.from('./snakebody.png');
const foodImg = PIXI.Texture.from('./food.png');

let head = new PIXI.Sprite(snakeH);
let food = new PIXI.Sprite(foodImg);
let gameScene = new PIXI.Container();
gameScene.sortableChildren  = true;
let bg
let game
let gameArea
let snakeId
let activeCell = [];
let bodySnake = new PIXI.Container();
let nextCell;
let snake = 3;
let deltaX;
let deltaY;
let eating = 0;
let snakeBounds = new PIXI.Rectangle(
  -20,
  -20,
  app.screen.width + 40,
  app.screen.height + 40
);

function pause () {
  if (game.status === 'playing') {
    socket.emit('paused')
    app.stop()
  } else if (game.status === 'paused') {
    socket.emit('resumed')
    app.start()
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
    document.getElementById('score').innerText = snake
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
  bodySnake.removeChildren()
  gameScene.removeChildren()
  app.ticker.remove(playGame)
  console.log(app.ticker)

  // head = null
  // food = null
  // gameScene = null
  activeCell = [];
  
  // //bodySnake = [];
  //nextCell = null
  snake = 3;
  deltaX = 0
  deltaY = 0
  eating = 0;
  socket.emit('exit')
  showBlock('menu')
  hideBlock('gameplay')
}

function startNewGame () {
  console.log('startNewGame')

  document.body.appendChild(app.view);

  setFood();
  setHead();
  setBody();

  app.stage.addChild(gameScene);
  
  app.ticker.add(playGame);
}

function playGame (delta) { 
  if (delta < 1.5) {
    moveHead(delta)
    bodySnake.children.forEach((body, i) => {
    moveBody(body, i)
  })
  }
}

function setHead () {
  head.y = 0.5 * gameArea.cell;
  head.x = 0.5 * gameArea.cell;
  head.route = Routes.RIGHT;
  head.speed = 3;
  head.anchor.x = 0.5;
  head.anchor.y = 0.5;
  head.nextRoute = Routes.RIGHT;
  head.step = 0;
  head.d = 0;
  head._zIndex = 301;
  gameScene.addChild(head);
}

function setBody () {
  for (let i = 0; i < snake * 4; i++) {
    const body = new PIXI.Sprite(snakeB);
    body.y = 0.5 * gameArea.cell;
    body.x = head.x - 20 - i * 10;
    body.route = Routes.RIGHT;
    body.anchor.x = 0.5;
    body.anchor.y = 0.5;
    body.nextRoute = Routes.RIGHT;
    body.step = 20 - i * 10;
    body.d = 0;
    body._zIndex = 300 - i;
    //bodySnake.push(body)
    bodySnake.addChild(body);
  }
  gameScene.addChild(bodySnake);
}

function setNextRoute (event) {
  if ( ! (event.key in KeyMap)) {
    return
  }
  let requestedRoute = KeyMap[event.key];
  if (requestedRoute === Routes.UP
    && head.route === Routes.DOWN) {
    return
  }
  if (requestedRoute === Routes.DOWN 
    && head.route === Routes.UP) {
    return
  }
  if (requestedRoute === Routes.RIGHT 
    && head.route === Routes.LEFT) {
    return
  }
  if (requestedRoute === Routes.LEFT 
    && head.route === Routes.RIGHT) {
    return
  }
  head.nextRoute = requestedRoute
}

function moveHead (delta) {
  cheackBounds(head);

  if (head.step >= gameArea.cell - 5) {
    head.d  = head.step - gameArea.cell
    rotation();  
    head.step = head.d;
    if (cheackHeadInBody()) {
      console.log('gameOver')
      return
    }
  }
  const velocity = Velocities[head.route]

  head.rotation = Rotations[head.route]

  deltaX = delta * head.speed
  deltaY = delta * head.speed

  head.x += deltaX * velocity.x
  head.y += deltaY * velocity.y

  if ((head.route === Routes.RIGHT) || (head.route === Routes.LEFT)) {
    head.step += deltaX 
  } else {
    head.step += deltaY 
  }
}

function moveBody (body, i) {
  let eat = false
  cheackBounds(body);

  if (body.step >= gameArea.cell - 5) {
    body.d  = body.step - gameArea.cell
    rotationBody(body, i);  
    body.step = body.d;
    eat = true
  }

  const velocity = Velocities[body.route]

  body.rotation = Rotations[body.route]

  body.x += deltaX * velocity.x
  body.y += deltaY * velocity.y

  if ((body.route === Routes.RIGHT) || (body.route === Routes.LEFT)) {
    body.step += deltaX 
  } else {
    body.step += deltaY 
  }
  if (eating && eat && i === bodySnake.children.length - 1) {
    const lastBody = bodySnake.children[bodySnake.children.length - 1]
    const body = new PIXI.Sprite(snakeB);
    body.x = lastBody.x - 10 * Velocities[lastBody.route].x;
    body.y = lastBody.y - 10 * Velocities[lastBody.route].y;
    body.route = lastBody.route;
    body.anchor.x = 0.5;
    body.anchor.y = 0.5;
    body.nextRoute = lastBody.route;
    body.step = lastBody.step - 10;
    body.d = 0;
    body._zIndex = lastBody._zIndex - 1;
    //bodySnake.push(body)
    bodySnake.addChild(body);
    eating -= 1;
    console.log('eating', body)
    eat = false;
  }
}

function cheackBounds (obj) {
  if (obj.x < snakeBounds.x) {
    obj.x += snakeBounds.width;
  } else if (obj.x > snakeBounds.x + snakeBounds.width) {
    obj.x -= snakeBounds.width;
  }

  if (obj.y < snakeBounds.y) {
    obj.y += snakeBounds.height;
  } else if (obj.y > snakeBounds.y + snakeBounds.height) {
    obj.y -= snakeBounds.height;
  }
}

function rotation () {
  let newBend = {
    x: null,
    y: null,
    route: null,
    routed: 0
  };
  newBend.x = Math.round(head.x / 10) * 10
  newBend.y = Math.round(head.y / 10) * 10
  if (head.nextRoute !== head.route
    && head.x > 0
    && head.x < app.screen.width
    && head.y > 0
    && head.y < app.screen.height) {
    if (head.route === Routes.RIGHT) {
      head.y += head.nextRoute === Routes.DOWN ? head.d  : -head.d 
      head.x = Math.round(head.x - head.d );
    } else if (head.route === Routes.LEFT) {
      head.y += head.nextRoute === Routes.DOWN ? head.d  : -head.d 
      head.x = Math.round(head.x + head.d );
    } else if (head.route === Routes.UP) {
      head.x += head.nextRoute === Routes.RIGHT ? head.d  : -head.d 
      head.y = Math.round(head.y + head.d );
    } else if (head.route === Routes.DOWN) {
      head.x += head.nextRoute === Routes.RIGHT ? head.d  : -head.d 
      head.y = Math.round(head.y - head.d );
    }
    head.route = head.nextRoute;
  }
  if (newBend.x === food.x && newBend.y === food.y) {
    eatFood()
    setFood()
  }
  newBend.route = head.route;
  activeCell.push(newBend);
}

function eatFood () {
  eating += 4
  snake +=1
}

function rotationBody (body, i) {
  let newBendIndex = activeCell.findIndex((bend) => {
    return (Math.round(body.x / 10) * 10) === bend.x && (Math.round(body.y / 10) * 10) === bend.y
  })
  if (activeCell[newBendIndex] && i !== activeCell[newBendIndex].routed) {
    console.log('error', i, activeCell[newBendIndex])
  }
  if (activeCell[newBendIndex]) {
    body.nextRoute = activeCell[newBendIndex].route 
    activeCell[newBendIndex].routed += 1
    if (activeCell[newBendIndex].routed === bodySnake.children.length) {
      activeCell.shift()
    }
  }
  if (body.nextRoute !== body.route) {
    if (body.route === Routes.RIGHT) {
      body.y += body.nextRoute === Routes.DOWN ? body.d  : -body.d 
      body.x = Math.round(body.x - body.d );
    } else if (body.route === Routes.LEFT) {
      body.y += body.nextRoute === Routes.DOWN ? body.d  : -body.d 
      body.x = Math.round(body.x + body.d );
    } else if (body.route === Routes.UP) {
      body.x += body.nextRoute === Routes.RIGHT ? body.d  : -body.d 
      body.y = Math.round(body.y + body.d );
    } else if (body.route === Routes.DOWN) {
      body.x += body.nextRoute === Routes.RIGHT ? body.d  : -body.d 
      body.y = Math.round(body.y - body.d );
    }
  }
  body.route = body.nextRoute;
}

function cheackHeadInBody () {
  if (activeCell.filter((bend) => {
    return activeCell[activeCell.length - 1].x === bend.x && activeCell[activeCell.length - 1].y === bend.y
  }).length > 1) {
    app.stop()
    return true
  }
}

function setFood () {
  let posForFood = {
    x: randomInteger(0, (app.screen.width - gameArea.cell) / gameArea.cell) * gameArea.cell, 
    y: randomInteger(0, (app.screen.height - gameArea.cell) / gameArea.cell) * gameArea.cell
  }
  if (!activeCell.filter(bend => bend.x === posForFood.x + 20 && bend.y === posForFood.y + 20)[0]) {
    food.x = posForFood.x + 20
    food.y = posForFood.y + 20
    food.anchor.x = 0.5;
    food.anchor.y = 0.5;
    gameScene.addChild(food);
  } else {
    setFood()
  }
}

function randomInteger (min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}
