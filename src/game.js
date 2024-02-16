const EventEmitter = require('events')
const gameArea = {
  width: 800,
  height: 600,
  cell: 40,
}

const Statuses = {
  WAIT: 'wait',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished'
}

function createGame () {
  let timerId

  let state = {
    status: Statuses.WAIT,
    snakes: [],
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
      changeStatus(Statuses.PAUSED)
    } else if (state.status === Statuses.PAUSED) {
      console.log('Game resumed')
      timerId = setInterval(playGame, state.speed)
      changeStatus(Statuses.PLAYING)
    }
  }

  function addSnake () {
    let id = generateId()
    state.snakes.push({
      id
    })
    return id
  }

  function startNewGame () {
    console.log('Start new game')
    changeStatus(Statuses.PLAYING)
    emitter.emit('game', {data: state, step: gameArea.cell})
  }

  function shutdown () {
    console.log('shutdown')
    changeStatus(Statuses.WAIT)
  }

  function playGame () {
    emitter.emit('game', {data: state, step: gameArea.cell})
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

  return {
    shutdown,
    startNewGame,
    addSnake,
    getState,
    getArea,
    pauseOrResume,
    on,
    off
  }
}

module.exports = createGame