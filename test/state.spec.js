'use strict'

const tape = require('tape-catch')
const _test = require('tape-promise').default
const test = _test(tape)

const { State, Pair, get, modify, gets } = require('../src/index')

const assign = o1 => o2 => Object.assign({}, o2, o1)

test('runState calls wrapped function with the given state', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    t.equal(state, s)
    return Pair(s * 2, s)
  }

  State(stateFn).runState(state)
  t.end()
})

test('runState returns the result returned by the wrapped function', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const result = State(stateFn).runState(state)
  t.deepEqual(result, stateFn(state))
  t.end()
})

test('evalState calls wrapped function with the given state', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    t.equal(state, s)
    return Pair(s * 2, s)
  }

  State(stateFn).evalState(state)
  t.end()
})

test('evalState returns the value returned by the wrapped function', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const result = State(stateFn).evalState(state)
  t.deepEqual(result, stateFn(state).fst)
  t.end()
})

test('execState calls wrapped function with the given state', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    t.equal(state, s)
    return Pair(s * 2, s)
  }

  State(stateFn).execState(state)
  t.end()
})

test('execState returns the state returned by the wrapped function', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const result = State(stateFn).execState(state)
  t.deepEqual(result, stateFn(state).snd)
  t.end()
})

test('mapState returns a new State that maps both the result and the state of the previous computation', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  State(stateFn)
    .mapState(mappedState => {
      t.deepEqual(stateFn(state), mappedState)
    })
    .runState(state)
  t.end()
})

test('mapState returns the result returned by the mapping function', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const mapFn = pair => {
    return Pair(pair.fst * 2, pair.snd + 2)
  }

  const result = State(stateFn)
    .mapState(mapFn)
    .runState(state)
  t.deepEqual(result, mapFn(stateFn(state)))
  t.end()
})

test('withState returns a new State that maps the state of the next computation', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  State(stateFn)
    .withState(mappedState => {
      t.deepEqual(state, mappedState)
    })
    .runState(state)
  t.end()
})

test('withState returns the result returned by the mapping function', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const mapFn = s => {
    return s * 2
  }

  const result = State(stateFn)
    .withState(mapFn)
    .runState(state)
  t.deepEqual(result, stateFn(mapFn(state)))
  t.end()
})

test('map returns a new State that maps the value of the previous computation', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  State(stateFn)
    .map(mappedValue => {
      t.deepEqual(stateFn(state).fst, mappedValue)
    })
    .runState(state)
  t.end()
})

test('map returns the value returned by the mapping function and the previous state', function(t) {
  t.plan(1)

  const state = 42

  const stateFn = s => {
    return Pair(s * 2, s)
  }

  const mapFn = s => {
    return s * 2
  }

  const result = State(stateFn)
    .map(mapFn)
    .runState(state)
  t.deepEqual(result, Pair(mapFn(stateFn(state).fst), stateFn(state).snd))
  t.end()
})

test('join flattens a recursive State', function(t) {
  t.plan(1)

  const state = 42

  const firstStateFn = s => {
    return Pair(s * 2, s + 1)
  }

  const secondStateFn = a => s => {
    return Pair(s + a, s)
  }

  const result = State(firstStateFn)
    .map(mappedValue => {
      return State(secondStateFn(mappedValue))
    })
    .join()
    .runState(state)
  t.deepEqual(result, Pair(84 + 43, 43))
  t.end()
})

test('bind maps a State and joins it', function(t) {
  t.plan(1)

  const state = 42

  const firstStateFn = s => {
    return Pair(s * 2, s + 1)
  }

  const secondStateFn = a => s => {
    return Pair(s + a, s)
  }

  const result = State(firstStateFn)
    .bind(mappedValue => {
      return State(secondStateFn(mappedValue))
    })
    .runState(state)
  t.deepEqual(result, Pair(84 + 43, 43))
  t.end()
})

test('app code sample (modify)', function(t) {
  const state = {
    parents: {
      Robert: { lastName: 'Parr' },
      Helen: { lastName: 'Parr' }
    },
    children: {
      Violet: { lastName: 'Parr' },
      John: { middleName: 'Jackson', lastName: 'Parr' }
    }
  }

  const getFamilyMember = (...args) => family =>
    args.reduce((acc, val) => (acc && acc[val] ? acc[val] : {}), family)
  const setFamilyMember = (path, updatedNode) => family =>
    Object.assign(
      {},
      family,
      path.reduceRight(
        (acc, key, i) =>
          Object.assign(
            {},
            {
              [key]: Object.assign(
                {},
                getFamilyMember(...path.slice(0, i + 1))(family),
                acc
              )
            }
          ),
        updatedNode
      )
    )

  t.test('add child', function(st) {
    const newBornName = ['children', 'Dashiel']
    const newBorn = { lastName: 'Parr', nickname: 'Dash' }

    const addFamilyMember = (name, newMember) =>
      modify(setFamilyMember(name, newMember))

    const updatedFamily = addFamilyMember(newBornName, newBorn).execState(state)

    st.deepEqual(
      updatedFamily,
      Object.assign({}, state, {
        children: Object.assign({}, state.children, {
          [newBornName[1]]: newBorn
        })
      })
    )
    st.end()
  })

  t.test('merge nicknames', function(st) {
    st.plan(1)
    const childToUpdate = ['children', 'John']
    const childDataToMerge = { nickname: 'JackJack' }
    const parentToUpdate = ['parents', 'Helen']
    const parentDataToMerge = { nickname: 'Elastigirl' }

    const updateFamilyMember = (name, updateFn) =>
      gets(getFamilyMember(...name))
        .map(updateFn)
        .bind(updatedMember =>
          get().bind(() => modify(setFamilyMember(name, updatedMember)))
        )

    const updatedFamily = updateFamilyMember(
      childToUpdate,
      assign(childDataToMerge)
    )
      .bind(() => updateFamilyMember(parentToUpdate, assign(parentDataToMerge)))
      .execState(state)

    st.deepEqual(
      updatedFamily,
      Object.assign({}, state, {
        parents: Object.assign({}, state.parents, {
          [parentToUpdate[1]]: Object.assign(
            {},
            state.parents[parentToUpdate[1]],
            parentDataToMerge
          )
        }),
        children: Object.assign({}, state.children, {
          [childToUpdate[1]]: Object.assign(
            {},
            state.children[childToUpdate[1]],
            childDataToMerge
          )
        })
      })
    )
    st.end()
  })

  t.end()
})
