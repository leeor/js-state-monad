'use strict'

const { Pair } = require('./pair')

// State :: (state -> Pair(value, state)) -> State
const State = fn => {
  return {
    // runState :: state -> Pair(value, state)
    runState(state) {
      return fn(state)
    },

    // evalState :: state -> value
    evalState(state) {
      return this.runState(state).fst
    },

    // execState :: state -> state
    execState(state) {
      return this.runState(state).snd
    },

    // mapState :: (Pair(value: a, state) -> Pair(value: b, state)) -> (state -> Pair(value: b, state))
    mapState(f) {
      const runState = this.runState
      return State(state => {
        return f(runState(state))
      })
    },

    // withState :: (state -> state) -> (state -> Pair(value, state))
    withState(f) {
      const runState = this.runState
      return State(state => {
        return runState(f(state))
      })
    },

    // map :: (value -> value) -> (state -> Pair(value, state))
    map(f) {
      const runState = this.runState
      return State(state => {
        const result = runState(state)
        return Pair(f(result.fst), result.snd)
      })
    },

    // join :: () -> (state -> Pair(value, state))
    join() {
      const runState = this.runState
      return State(state => {
        const inner = runState(state)
        return inner.fst.runState(inner.snd)
      })
    },

    // bind :: (state -> State) -> (state -> Pair(value, state))
    bind(f) {
      return this.map(f).join()
    }
  }
}

const get = () => State(s => Pair(s, s))
const put = state => State(() => Pair(undefined, state))
const modify = fn => State(state => Pair(undefined, fn(state)))
const gets = fn => State(state => Pair(fn(state), state))
const pure = value => State(state => Pair(value, state))

module.exports.State = State
module.exports.get = get
module.exports.put = put
module.exports.modify = modify
module.exports.gets = gets
module.exports.pure = pure
