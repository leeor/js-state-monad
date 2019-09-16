/* eslint-env jest */
'use strict'

const { get, put, gets, modify } = require('../src/index')

describe('State Monad - simple game example', function() {
  // Game rules:
  // Process a sequence of letters, keeping score according to the following:
  // 'a': +1
  // 'b': -1
  // 'c': on/off
  //
  // When the game is 'off', the score does not change. The game start 'off'.
  //
  // The game's state is represented as (Bool, Int) - on/off status and current score

  const gameSequence = 'abcaaacbbcabbab'
  const startState = { on: false, score: 0 }
  const expectedResult = 2

  // increaseScore :: State -> State
  const increaseScore = state =>
    Object.assign({}, state, { score: state.score + 1 })
  // decreaseScore :: State -> State
  const decreaseScore = state =>
    Object.assign({}, state, { score: state.score - 1 })

  // toggleGameState :: State -> State
  const toggleGameState = state => Object.assign({}, state, { on: !state.on })

  test('using get/put', function() {
    const playGame = sequence => {
      if (sequence.length === 0) {
        return gets(state => state.score)
      }

      return get().bind(state => {
        switch (sequence.slice(0, 1)) {
          case 'a':
            return put(state.on ? increaseScore(state) : state).bind(() =>
              playGame(sequence.slice(1))
            )
          case 'b':
            return put(state.on ? decreaseScore(state) : state).bind(() =>
              playGame(sequence.slice(1))
            )
          case 'c':
            return put(toggleGameState(state)).bind(() =>
              playGame(sequence.slice(1))
            )
        }
      })
    }

    const gameResult = playGame(gameSequence).evalState(startState)

    expect(gameResult).toEqual(expectedResult)
  })

  test('using modify', function() {
    const playGame = sequence => {
      if (sequence.length === 0) {
        return gets(state => state.score)
      }

      return modify(state => {
        switch (sequence.slice(0, 1)) {
          case 'a':
            return state.on ? increaseScore(state) : state
          case 'b':
            return state.on ? decreaseScore(state) : state
          case 'c':
            return toggleGameState(state)
        }
      }).bind(() => playGame(sequence.slice(1)))
    }

    const gameResult = playGame(gameSequence).evalState(startState)

    expect(gameResult).toEqual(expectedResult)
  })

  test('using withState', function() {
    const playGame = sequence => {
      if (sequence.length === 0) {
        return gets(state => state.score)
      }

      return modify(state => {
        switch (sequence.slice(0, 1)) {
          case 'a':
            return state.on ? increaseScore(state) : state
          case 'b':
            return state.on ? decreaseScore(state) : state
          case 'c':
            return toggleGameState(state)
        }
      }).bind(() => playGame(sequence.slice(1)))
    }

    const gameResult = playGame(gameSequence).evalState(startState)

    expect(gameResult).toEqual(expectedResult)
  })

  test('using recursion', function() {
    const playGame = sequence => state => {
      if (sequence.length === 0) {
        return state
      }

      switch (sequence.slice(0, 1)) {
        case 'a':
          return playGame(sequence.slice(1))(
            state.on ? increaseScore(state) : state
          )
        case 'b':
          return playGame(sequence.slice(1))(
            state.on ? decreaseScore(state) : state
          )
        case 'c':
          return playGame(sequence.slice(1))(toggleGameState(state))
      }
    }

    const gameResult = playGame(gameSequence)(startState).score

    expect(gameResult).toEqual(expectedResult)
  })
})
