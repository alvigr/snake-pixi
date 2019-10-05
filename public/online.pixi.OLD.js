const Routes = { 
  UP: 'up', 
  DOWN: 'down', 
  RIGHT: 'right', 
  LEFT: 'left'
};

const CELL = 40;
let routeCell

const Velocities = {
  [Routes.UP]: { x: 0, y: -1 },
  [Routes.DOWN]: { x: 0, y: 1 },
  [Routes.RIGHT]: { x: 1, y: 0 },
  [Routes.LEFT]: { x: -1, y: 0 },
};

const Rotations = {
  [Routes.UP]: 3 * Math.PI / 2,
  [Routes.DOWN]: Math.PI / 2,
  [Routes.RIGHT]: 0,
  [Routes.LEFT]: Math.PI,
};

const keyMap = { 
  ArrowUp: Routes.UP, 
  ArrowDown: Routes.DOWN, 
  ArrowRight: Routes.RIGHT, 
  ArrowLeft: Routes.LEFT
};

const app = new PIXI.Application({
  width: 20 * CELL, 
  height: 15 * CELL, 
  backgroundColor: 0xE3E3E3,
});
document.body.appendChild(app.view);
document.addEventListener('keydown', setNextRoute);

const snakeH = PIXI.Texture.from('./snakehead.png');
const snakeB = PIXI.Texture.from('./snakebody.png');
const snakeT = PIXI.Texture.from('./snaketale.png');
const bgCell = PIXI.Texture.from('./cell.png');

const head = new PIXI.Sprite(snakeH);
const tale = new PIXI.Sprite(snakeT);

let gameScene = new PIXI.Container();
let bg = new PIXI.Container();

gameScene.sortableChildren  = true;
bg.zIndex = 1;

for (let i = 0; i < app.screen.height; i += CELL) {
  for (let j = 0; j < app.screen.width; j += CELL) {
    const cell = new PIXI.Sprite(bgCell);
    cell.x = j;
    cell.y = i;
    bg.addChild(cell);
  }
}

head.y = 0.5 * CELL;
head.x = 0.5 * CELL;
head.route = Routes.RIGHT;
head.speed = 3;
head.anchor.x = 0.5;
head.anchor.y = 0.5;
head.nextRoute = Routes.RIGHT;
head.step = 0;
head.d = 0;
head._zIndex = 301;

let bends = [];
let activeCell = [];
let bodySnake = [];

for (let i = 0; i < 24; i++) {
  const body = new PIXI.Sprite(snakeB);
  body.y = 0.5 * CELL;
  body.x = head.x - 20 - i * 10;
  body.route = Routes.RIGHT;
  body.anchor.x = 0.5;
  body.anchor.y = 0.5;
  body.nextRoute = Routes.RIGHT;
  body.step = 20 - i * 10;
  body.d = 0;
  body._zIndex = 300 - i;
  bodySnake.push(body)
  gameScene.addChild(body);
}

gameScene.addChild(head);

let nextCell;
let deltaX;
let deltaY;

function moveHead (delta) {

  if (head.step >= CELL) {
    head.d  = head.step - CELL
    rotation();  
    head.step = head.d ;
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

  cheackBounds(head);
}

function moveBody (body, i) {
  if (body.step >= CELL) {
    body.d  = body.step - CELL
    rotationBody(body, i);  
    body.step = body.d ;
  }

  const velocity = Velocities[body.route]
  body.x += deltaX * velocity.x
  body.y += deltaY * velocity.y

  if ((body.route === Routes.RIGHT) || (body.route === Routes.LEFT)) {
    body.step += deltaX 
  } else {
    body.step += deltaY 
  }

  cheackBounds(body);
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
  if (bends.findIndex((bend) => {
    return newBend.x === bend.x && newBend.y === bend.y
  }) !== -1) {
    app.stop()
  }
  newBend.route = head.route;
  bends.push(newBend);
}

function rotationBody (body, i) {
  let newBend = bends.find((bend) => {
    return (Math.round(body.x / 10) * 10) === bend.x && (Math.round(body.y / 10) * 10) === bend.y
  })
  body.nextRoute = newBend ? newBend.route : body.route
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
  if (newBend && i === bodySnake.length - 1) {
    bends.shift()
  }
}

app.stage.addChild(bg);
app.stage.addChild(gameScene);

const snakeBounds = new PIXI.Rectangle(
  -20,
  -20,
  app.screen.width + 40,
  app.screen.height + 40
);

app.ticker.add((delta) => {
  moveHead(delta)
  bodySnake.forEach((body, i) => {
    moveBody(body, i)
  }) 
});

function setNextRoute (event) {
  if ( ! (event.key in keyMap)) {
    return
  }
  let requestedRoute = keyMap[event.key];
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
