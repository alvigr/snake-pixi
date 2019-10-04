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
const body = new PIXI.Sprite(snakeB);

let gameScene = new PIXI.Container();
let bg = new PIXI.Container();

let myBezier = {bezier:[{x:80, y:20}], ease: Linear.easeNone};

let d = 0;

bg.zIndex = -1;

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
head.speed = 2;
head.anchor.x = 0.5;
head.anchor.y = 0.5;
head.nextRoute = {
  cell: null,
  route: Routes.RIGHT,
};

head.bend = []

// tale.x = head.x - 80;
// tale.y = 0.5 * CELL;
// tale.route = Routes.RIGHT;
// tale.anchor.x = 0.5;
// tale.anchor.y = 0.5;
// tale.nextRoute = {
//   cell: null,
//   route: null,
// };

body.y = 0.5 * CELL;
body.x = head.x - 40;
body.route = Routes.RIGHT;
body.anchor.x = 0.5;
body.anchor.y = 0.5;

// gameScene.addChild(tale);
gameScene.addChild(body);
gameScene.addChild(head);

let needRoute = false;
let routed = true;
let nextCell;
let step = 0;
let deltaX;
let deltaY;

function moveHead (delta) {
  

  if (step >= CELL) {
    d = step - CELL
    rotation();  
    step = d;
  }

  const velocity = Velocities[head.route]

  head.rotation = Rotations[head.route]

  deltaX = delta * head.speed
  deltaY = delta * head.speed

  head.x += deltaX * velocity.x
  head.y += deltaY * velocity.y

  if ((head.route === Routes.RIGHT) || (head.route === Routes.LEFT)) {
    step += deltaX 
  } else {
    step += deltaY 
  }

  cheackBounds(head);
  // cheackBounds(tale);

}

function moveBody () {
  const velocity = Velocities[body.route]
  body.x += deltaX * velocity.x
  body.y += deltaY * velocity.y
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
  if (head.nextRoute.route !== head.route) {
    if (head.route === Routes.RIGHT) {
      console.log('y', head.y)
      head.y += head.nextRoute.route === Routes.DOWN ? d : -d
      head.x = Math.round(head.x - d);
      console.log('x', head.x)
    } else if (head.route === Routes.LEFT) {
      console.log('y', head.y)
      head.y += head.nextRoute.route === Routes.DOWN ? d : -d
      head.x = Math.round(head.x + d);
      console.log('x', head.x)
    } else if (head.route === Routes.UP) {
      console.log('x', head.x)
      head.x += head.nextRoute.route === Routes.RIGHT ? d : -d
      head.y = Math.round(head.y + d);
      console.log('y', head.y)
    } else if (head.route === Routes.DOWN) {
      console.log('x', head.x)
      head.x += head.nextRoute.route === Routes.RIGHT ? d : -d
      head.y = Math.round(head.y - d);
      console.log('y', head.y)
    }
    head.route = head.nextRoute.route;
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
  moveBody()
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
  head.nextRoute.route = requestedRoute
  needRoute = true
}
