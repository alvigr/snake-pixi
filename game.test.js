const createGame = require('./game')

let game 

jest.useFakeTimers()

beforeEach(() => {
  game = createGame()
})

afterEach(() => {
  game.shutdown()
})

test('status playing after starting new game', () => {
  expect(game.getState().status).toBe('wait')
  game.addSnake()
  game.startNewGame()
  expect(game.getState().status).toBe('playing')
})

test('run parallel games', () => {
  const game1 = createGame()
  const game2 = createGame()
  game1.addSnake()
  game2.addSnake()
  game1.startNewGame()
  game2.startNewGame()
  game1.pauseOrResume()
  expect(game1.getState().status).toBe('paused')
  expect(game2.getState().status).toBe('playing')
  game1.shutdown()
  game2.shutdown()
})

test('snake is moving', () => {
  game.addSnake()
  game.startNewGame()
  const { x } = game.getState().snakes[0].positionHead
  console.log(x)
  jest.advanceTimersByTime(1000) 

  expect(game.getState().snakes[0].positionHead.y).toBe(0)
  expect(game.getState().snakes[0].positionHead.x).toBeGreaterThan(x)
})

test('snake move to down', () => {
  game.addSnake()
  game.startNewGame()
  let id = game.getState().snakes[0].id
  game.setNextRoute('down', id)
  jest.runOnlyPendingTimers()
  expect(game.getState().snakes[0].positionHead.y).toBeGreaterThan(0)
})

test('snake level up', () => {
  const orig = Math.random
  const randVals = [
    0, 0, 0, 0, 0, 0, // used for generateId()
    0, 0, 0.9, 0.9
  ]
  Math.random = () => { return randVals.shift() }
  game.addSnake()
  game.startNewGame()

  jest.runOnlyPendingTimers()
  expect(game.getState().snakes[0].level).toBe(6)

  Math.random = orig
})


