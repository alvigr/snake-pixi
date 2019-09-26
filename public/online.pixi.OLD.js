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
  r: null,
  route: null,
};

const moveSnake = (delta) => {
  snake.route = rotation()

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
  let nx, ny;
  if (requestedRoute === Routes.UP && snake.route === Routes.DOWN) {
    return
  }
  if (requestedRoute === Routes.DOWN && snake.route === Routes.UP) {
    return
  }
  if (requestedRoute === Routes.RIGHT && snake.route === Routes.LEFT) {
    return
  }
  if (requestedRoute === Routes.LEFT && snake.route === Routes.RIGHT) {
    return
  }
  snake.nextRoute.route = requestedRoute

  switch (snake.route) {
    case Routes.LEFT:
      nx = Math.floor(snake.x / 40) * 40
      snake.nextRoute.r = new PIXI.Rectangle (
        nx - 30,
        snake.y + 10,
        nx + 10,
        snake.y - 10,
      )
    break;
    case Routes.UP:
      ny = Math.floor(snake.y / 40) * 40
      snake.nextRoute.r = new PIXI.Rectangle (
        snake.x - 10,
        ny - 30,
        snake.x + 10,
        ny + 10,
      )
    break;
    case Routes.DOWN:
      ny = Math.ceil(snake.y / 40) * 40
      snake.nextRoute.r = new PIXI.Rectangle (
        snake.x - 10,
        ny + 10,
        snake.x + 10,
        ny + 30,
      )
    break;
    default:
      nx = Math.ceil(snake.x / 40) * 40
      snake.nextRoute.r = new PIXI.Rectangle (
        nx + 10,
        snake.y + 10,
        nx + 30,
        snake.y - 10,
      )
    break;
  }
  console.log(snake.x, nx, snake.y, ny)
}

function rotation () {
  if (routeCell && hitTestRectangle(snake, snake.nextRoute.r)) {
    return snake.route;
  } else if (snake.nextRoute.route && hitTestRectangle(snake, snake.nextRoute.r)) {
    routeCell = snake.nextRoute.r;
    return snake.nextRoute.route;
  }
  routeCell = undefined;
  return snake.route;
}

function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};
