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
  game = data.data
  gameArea = data.gameArea
  document.getElementById('score').innerText = snake
  document.getElementById('ico-pause').className = game.status === 'paused' ? 'play' : 'pause'
})

socket.on('disconnect', function () {
  console.error('lost connection')
})

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



const snakeH = PIXI.Texture.from('./snakehead.png');
const snakeB = PIXI.Texture.from('./snakebody.png');
const snakeBD = PIXI.Texture.from('./snakebodyd.png');
const foodImg = PIXI.Texture.from('./food.png');

let renderer,
stage,
ticker,
head,
food,
gameScene,
bg,
game,
gameArea,
snakeId,
nextCell,
deltaX,
deltaY,
snakeBounds,
eating = 0,
snake = 3,
speed = 2.4,
activeCell = [],
bodySnake = [];

function pause () {
  if (game.status === 'playing') {
    socket.emit('paused')
    ticker.stop()
  } else if (game.status === 'paused') {
    socket.emit('resumed')
    ticker.start()
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
  document.getElementById('exit').addEventListener('click', exit)
}

function connectToGame (mode) {
  console.log('Connect to game')
  socket.emit('requestInvite', {mode})
  hideBlock('menu')
  showBlock('waiting')
}

function exit () {
  console.log('exit')
  socket.emit('exit')
  resetState()
  showBlock('menu')
  hideBlock('gameplay')
}

function resetState () {
  ticker.destroy()
  renderer.destroy(true)
  activeCell = [];
  bodySnake = [];
  snake = 3;
  speed = 2.4
  deltaX = 0
  deltaY = 0
  eating = 0;
}

function startNewGame () {
  console.log('startNewGame', ticker)
  renderer = new PIXI.Renderer({ width: 800, height: 600, backgroundColor: 0xDFEBE0 });
  document.body.appendChild(renderer.view);
  stage = new PIXI.Container();

  ticker = new PIXI.Ticker();
  ticker.add(() => {
    renderer.render(stage)
  }, PIXI.UPDATE_PRIORITY.LOW)
  ticker.start()

  head = new PIXI.Sprite(snakeH);
  food = new PIXI.Sprite(foodImg);
  gameScene = new PIXI.Container();
  gameScene.sortableChildren  = true;
  snakeBounds = new PIXI.Rectangle(
    -20,
    -20,
    renderer.screen.width + 40,
    renderer.screen.height + 40
  );
  setFood();
  setHead();
  setBody();
  stage.addChild(gameScene);
  ticker.add(playGame);
}

function playGame (delta) { 
  if (delta < 1.5) {
    moveHead(delta)
    bodySnake.forEach((body, i) => {
    moveBody(body, i)
  })
  }
}

function setHead () {
  head.y = 0.5 * gameArea.cell;
  head.x = 0.5 * gameArea.cell * 5;
  head.route = Routes.RIGHT;
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
    const body = i%2 === 0 ? new PIXI.Sprite(snakeB) : new PIXI.Sprite(snakeBD)
    body.y = 0.5 * gameArea.cell;
    body.x = head.x - 20 - i * 10;
    body.route = Routes.RIGHT;
    body.anchor.x = 0.5;
    body.anchor.y = 0.5;
    body.nextRoute = Routes.RIGHT;
    body.step = 20 - i * 10;
    body.d = 0;
    body._zIndex = 300 - i;
    bodySnake.push(body);
    gameScene.addChild(body);
  }
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
      setTimeout(() => {
        exit()
      }, 5000)
      return
    }
  }
  const velocity = Velocities[head.route]

  head.rotation = Rotations[head.route]

  deltaX = delta * speed
  deltaY = delta * speed

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
  if (eating && eat && i === bodySnake.length - 1) {
    const lastBody = bodySnake[bodySnake.length - 1]
    const body = i%2 === 0 ? new PIXI.Sprite(snakeBD) : new PIXI.Sprite(snakeB) 
    body.x = lastBody.x - 10 * Velocities[lastBody.route].x;
    body.y = lastBody.y - 10 * Velocities[lastBody.route].y;
    body.route = lastBody.route;
    body.anchor.x = 0.5;
    body.anchor.y = 0.5;
    body.nextRoute = lastBody.route;
    body.step = lastBody.step - 10;
    body.d = 0;
    body._zIndex = lastBody._zIndex - 1;
    bodySnake.push(body);
    gameScene.addChild(body);
    eating -= 1;
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
    && head.x < renderer.screen.width
    && head.y > 0
    && head.y < renderer.screen.height) {
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
  if (snake % 5 === 0) {
    speed += 0.2
  }
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
    if (activeCell[newBendIndex].routed === bodySnake.length) {
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
    ticker.stop()
    return true
  }
}

function setFood () {
  let posForFood = {
    x: randomInteger(0, (renderer.screen.width - gameArea.cell) / gameArea.cell) * gameArea.cell, 
    y: randomInteger(0, (renderer.screen.height - gameArea.cell) / gameArea.cell) * gameArea.cell
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
