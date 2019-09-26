const EventEmitter = require('events')
const gameArea = {
  width: 800,
  height: 600,
  cell: 20,
}

const Routes = { 
  UP: 'up', 
  DOWN: 'down', 
  RIGHT: 'right', 
  LEFT: 'left'
}

const Statuses = {
  WAIT: 'wait',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished'
}

const SnakeColors = [
  '#77C883', 
  '#60BBC0', 
  '#42A5F5', 
  '#66BB6A'
]

const StartPosition = [
  {
    positionHead: {
      x: gameArea.cell * (-1),
      y: 0
    },
    positionBody: [],
    nextRoute: Routes.RIGHT,
    route: Routes.RIGHT
  },
  {
    positionHead: {
      x: gameArea.cell * (-1),
      y: gameArea.height - gameArea.cell
    },
    positionBody: [],
    nextRoute: Routes.LEFT,
    route: Routes.LEFT
  }
]

function createGame () {
  let timerId

  let state = {
    status: Statuses.WAIT,
    speed: 170,
    snakes: [],
    food: {
      position: {
        x: 100,
        y: 100
      },
      color: '',
    },
    colorsSet: [
      '#EB5757', 
      '#9B51E0', 
      '#2F80ED', 
      '#F2C94C', 
      '#F2994A',
      '#56CCF2',
      '#D96BBA'
    ],
  }

  let emitter = new EventEmitter()

  function on (eventName, listener) {
    emitter.on(eventName, listener)
  }

  function off (eventName, listener) {
    emitter.off(eventName, listener)
  }

  function changeStatus (status) {
    state.status = status
  }

  function getState () {
    return state
  }

  function getArea () {
    return gameArea
  }

  function pauseOrResume () {
    if (state.status === Statuses.PLAYING) {
      console.log('Game paused')
      clearInterval(timerId)
      changeStatus(Statuses.PAUSED)
    } else if (state.status === Statuses.PAUSED) {
      console.log('Game resumed')
      timerId = setInterval(playGame, state.speed)
      changeStatus(Statuses.PLAYING)
    }
  }

  function addSnake () {
    let id = generateId()
    let start = StartPosition[state.snakes.length]
    state.snakes.push({
      id,
      level: 5,
      positionHead: {
        x: start.positionHead.x,
        y: start.positionHead.y
      },
      positionBody: [],
      // TODO: перезапись стартовой позиции тела
      nextRoute: start.nextRoute,
      route: start.route,
      //TODO: запоминать положения поворотов для реализации скругленных углов
      bend: {route: 'RD', position: {x: null, y: null}},
      color: nextColor()
    })
    return id
  }

  function nextColor () {
    return SnakeColors[state.snakes.length % SnakeColors.length]
  }

  function findSnakeWithId (id) {
    return state.snakes.findIndex(snake => snake.id === id)
  }

  function startNewGame () {
    console.log('Start new game')
    setFood(state.snakes[0])
    timerId = setInterval(playGame, state.speed)
    changeStatus(Statuses.PLAYING)
    emitter.emit('game', {data: state, step: gameArea.cell})
  }

  function shutdown () {
    console.log('shutdown')
    clearInterval(timerId)
    changeStatus(Statuses.WAIT)
  }

  function playGame () {
    if (finishGame()) {
      state.snakes.forEach((snake) => {
        setRoute(snake)
        moveTail(snake)
        moveHead(snake)
        eatFood(snake)
        checkPlay(snake)
        moveBody(snake)
      })
    }
    emitter.emit('game', {data: state, step: gameArea.cell})
  }

  function setNextRoute (requestedRoute, id) {
    let snake = state.snakes[findSnakeWithId(id)]
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
    if (state.status === Statuses.PLAYING) snake.nextRoute = requestedRoute
  }

  function setRoute (snake) {
    snake.route = snake.nextRoute
  }

  function moveHead (snake) {
    if (snake.route === 'right') {
      snake.positionHead.x += gameArea.cell
      if (snake.positionHead.x >= gameArea.width) {
        snake.positionHead.x = 0
      }
    }
    if (snake.route === 'left') {
      snake.positionHead.x -= gameArea.cell
      if (snake.positionHead.x < 0) {
        snake.positionHead.x = gameArea.width - gameArea.cell
      }
    }
    if (snake.route === 'up') {
      snake.positionHead.y -= gameArea.cell
      if (snake.positionHead.y < 0) {
        snake.positionHead.y = gameArea.height - gameArea.cell
      }
    }
    if (snake.route === 'down') {
      snake.positionHead.y += gameArea.cell
      if (snake.positionHead.y >= gameArea.height) {
        snake.positionHead.y = 0
      }
    }
  }

  function randomInteger (min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
  }

  function generateId () {
    const symbols = 'qwertyuiopasdfghjklzxcvbnm1234567890'
    let id = ''
    for (let i = 0; i < 6; i++) {
      id += symbols[randomInteger(0, symbols.length - 1)]
    }
    return id
  }

  function setFood (snake) {
    let posForFood = {
      x: randomInteger(0, (gameArea.width - gameArea.cell) / gameArea.cell) * gameArea.cell, 
      y: randomInteger(0, (gameArea.height - gameArea.cell) / gameArea.cell) * gameArea.cell
    }
    if (
      snake.positionBody.findIndex(function (element) {
        if (element.x === posForFood.x && element.y === posForFood.y) {
          return true
        }
      }) === -1
      && posForFood.x !== state.food.position.x
      && posForFood.y !== state.food.position.y
      ) {
      state.food.position.x = posForFood.x
      state.food.position.y = posForFood.y
    } else {
      setFood(snake)
    }
    state.food.color = state.colorsSet[
      randomInteger(0, state.colorsSet.length - 1)
    ]
  }

  function eatFood (snake) {
    if (
      snake.positionHead.x === state.food.position.x &
      snake.positionHead.y === state.food.position.y
      ) {
      snake.level++
      setFood(snake)
    }
  }

  function checkPlay (snake) {
    state.snakes.forEach((bodysSnakes) => {
      if (bodysSnakes.positionBody.find(
        function (element) {
          if (
            element.x === snake.positionHead.x
            && element.y === snake.positionHead.y
            ) {
            return true
          }
        }
      )) {
        changeStatus(Statuses.FINISHED)
      }
    })
  }

  function finishGame () {
    if (state.status === Statuses.FINISHED) {
      clearInterval(timerId)
      return false
    } else {
      return true
    }
  }

  function moveBody (snake) {
    snake.positionBody.push({
      x: snake.positionHead.x, 
      y: snake.positionHead.y
    })
  }

  function moveTail (snake) {
    while (snake.positionBody.length >= snake.level) {
      snake.positionBody.shift()
    }
  }

  return {
    shutdown,
    startNewGame,
    addSnake,
    getState,
    getArea,
    pauseOrResume,
    setNextRoute,
    on,
    off
  }
}

module.exports = createGame