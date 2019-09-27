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

const snake = PIXI.Sprite.from('./snakehead.png');
snake.y = 0.5 * CELL;
snake.x = 0;
snake.route = Routes.RIGHT;
snake.speed = 2;
snake.anchor.x = 0.5;
snake.anchor.y = 0.5;
snake.nextRoute = {
  cell: null,
  route: null,
};
let routed = true;
let finishTick

const moveSnake = (delta) => {
  finishTick = false
  if (!routed) {
    console.log('not routed')
    if (snake.route === Routes.RIGHT) {
     if (snake.x > snake.nextRoute.cell + 20) {
       snake.x = snake.nextRoute.cell + 20
       snake.route = snake.nextRoute.route
       snake.nextRoute.route = null
       routed = true
       console.log('routed')
     }
    } else if (snake.route === Routes.LEFT) {
      if (snake.x < snake.nextRoute.cell - 20) {
        snake.x = snake.nextRoute.cell - 20
        snake.route = snake.nextRoute.route
        snake.nextRoute.route = null
        routed = true
        console.log('routed')
      }
    } else if (snake.route === Routes.UP) {
      if (snake.y < snake.nextRoute.cell - 20) {
        snake.y = snake.nextRoute.cell - 20
        snake.route = snake.nextRoute.route
        snake.nextRoute.route = null
        routed = true
        console.log('routed')
      } 
    } else if (snake.route === Routes.DOWN) {
      if (snake.y > snake.nextRoute.cell + 20) {
        snake.y = snake.nextRoute.cell + 20
        snake.route = snake.nextRoute.route
        snake.nextRoute.route = null
        routed = true
        console.log('routed')
      }
    }
  }

  const velocity = Velocities[snake.route]

  snake.rotation = Rotations[snake.route]

  snake.x += velocity.x * delta * snake.speed
  snake.y += velocity.y * delta * snake.speed
  

  if (snake.x < snakeBounds.x) {
    snake.x += snakeBounds.width;
  } else if (snake.x > snakeBounds.x + snakeBounds.width) {
    snake.x -= snakeBounds.width;
  }

  if (snake.y < snakeBounds.y) {
    snake.y += snakeBounds.height;
  } else if (snake.y > snakeBounds.y + snakeBounds.height) {
    snake.y -= snakeBounds.height;
  }
  finishTick = true
}

app.stage.addChild(snake);

const snakeBounds = new PIXI.Rectangle(
  -20,
  -20,
  app.screen.width + 40,
  app.screen.height + 40
);

app.ticker.add((delta) =>  moveSnake(delta));

function setNextRoute (event) {
  if ( ! (event.key in keyMap)) {
    return
  }
  let requestedRoute = keyMap[event.key];
  if (requestedRoute === Routes.UP && (snake.route === Routes.DOWN || snake.route === Routes.UP)) {
    return
  }
  if (requestedRoute === Routes.DOWN && (snake.route === Routes.UP || snake.route === Routes.DOWN)) {
    return
  }
  if (requestedRoute === Routes.RIGHT && (snake.route === Routes.LEFT || snake.route === Routes.RIGHT)) {
    return
  }
  if (requestedRoute === Routes.LEFT && (snake.route === Routes.RIGHT || snake.route === Routes.LEFT)) {
    return
  }
  snake.nextRoute.route = requestedRoute
  let nextCell
  if (routed && finishTick) {
    routed = false
    switch (snake.route) {
      case Routes.LEFT:
        nextCell = Math.floor(snake.x / 40) * 40 - 20
        snake.nextRoute.cell = nextCell <= snakeBounds.x ? snakeBounds.width - 60 : nextCell
      break;
      case Routes.UP:
        nextCell = Math.floor(snake.y / 40) * 40 - 20
        snake.nextRoute.cell = nextCell <= snakeBounds.y ? snakeBounds.height - 40 : nextCell
      break;
      case Routes.DOWN:
        nextCell = Math.ceil(snake.y / 40) * 40 + 20
        snake.nextRoute.cell = nextCell >= snakeBounds.y + snakeBounds.height ? snakeBounds.y + 20 : nextCell
      break;
      case Routes.RIGHT:
        nextCell = Math.ceil(snake.x / 40) * 40 + 20
        snake.nextRoute.cell = nextCell >= snakeBounds.x + snakeBounds.width ? snakeBounds.x + 20 : nextCell
      break;
    }
  }
  console.log(snake.x, snake.y, snake.nextRoute.cell)
}
