/* eslint-env jest */
'use strict'

const { State, Pair, get, modify, gets } = require('../src/index')

const assign = o1 => o2 => Object.assign({}, o2, o1)

describe('State Monad', function() {
  const state = 42

  test('runState calls wrapped function with the given state', function() {
    expect.assertions(1)

    const stateFn = s => {
      expect(s).toEqual(state)
      return Pair(s * 2, s)
    }

    State(stateFn).runState(state)
  })

  test('runState returns the result returned by the wrapped function', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const result = State(stateFn).runState(state)
    expect(result).toEqual(stateFn(state))
  })

  test('evalState calls wrapped function with the given state', function() {
    const stateFn = s => {
      expect(s).toEqual(state)
      return Pair(s * 2, s)
    }

    State(stateFn).evalState(state)
  })

  test('evalState returns the value returned by the wrapped function', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const result = State(stateFn).evalState(state)
    expect(stateFn(state).fst).toEqual(result)
  })

  test('execState calls wrapped function with the given state', function() {
    expect.assertions(1)

    const stateFn = s => {
      expect(s).toEqual(state)
      return Pair(s * 2, s)
    }

    State(stateFn).execState(state)
  })

  test('execState returns the state returned by the wrapped function', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const result = State(stateFn).execState(state)
    expect(stateFn(state).snd).toEqual(result)
  })

  test('mapState returns a new State that maps both the result and the state of the previous computation', function() {
    expect.assertions(1)

    const stateFn = s => {
      return Pair(s * 2, s)
    }

    State(stateFn)
      .mapState(mappedState => {
        expect(stateFn(state)).toEqual(mappedState)
      })
      .runState(state)
  })

  test('mapState returns the result returned by the mapping function', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const mapFn = pair => {
      return Pair(pair.fst * 2, pair.snd + 2)
    }

    const result = State(stateFn)
      .mapState(mapFn)
      .runState(state)
    expect(result).toEqual(mapFn(stateFn(state)))
  })

  test('withState returns a new State that maps the state of the next computation', function() {
    expect.assertions(1)

    const stateFn = s => {
      return Pair(s * 2, s)
    }

    State(stateFn)
      .withState(mappedState => {
        expect(mappedState).toEqual(state)
      })
      .runState(state)
  })

  test('withState returns the result returned by the mapping function', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const mapFn = s => {
      return s * 2
    }

    const result = State(stateFn)
      .withState(mapFn)
      .runState(state)
    expect(result).toEqual(stateFn(mapFn(state)))
  })

  test('map returns a new State that maps the value of the previous computation', function() {
    expect.assertions(1)

    const stateFn = s => {
      return Pair(s * 2, s)
    }

    State(stateFn)
      .map(mappedValue => {
        expect(mappedValue).toEqual(stateFn(state).fst)
      })
      .runState(state)
  })

  test('map returns the value returned by the mapping function and the previous state', function() {
    const stateFn = s => {
      return Pair(s * 2, s)
    }

    const mapFn = s => {
      return s * 2
    }

    const result = State(stateFn)
      .map(mapFn)
      .runState(state)
    expect(Pair(mapFn(stateFn(state).fst), stateFn(state).snd)).toEqual(result)
  })

  test('join flattens a recursive State', function() {
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
    expect(result).toEqual(Pair(84 + 43, 43))
  })

  test('bind maps a State and joins it', function() {
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
    expect(result).toEqual(Pair(84 + 43, 43))
  })

  describe('app code sample (modify)', function() {
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

    test('add child', function() {
      const newBornName = ['children', 'Dashiel']
      const newBorn = { lastName: 'Parr', nickname: 'Dash' }

      const addFamilyMember = (name, newMember) =>
        modify(setFamilyMember(name, newMember))

      const updatedFamily = addFamilyMember(newBornName, newBorn).execState(
        state
      )

      expect(updatedFamily).toEqual(
        Object.assign({}, state, {
          children: Object.assign({}, state.children, {
            [newBornName[1]]: newBorn
          })
        })
      )
    })

    test('merge nicknames', function() {
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
        .bind(() =>
          updateFamilyMember(parentToUpdate, assign(parentDataToMerge))
        )
        .execState(state)

      expect(updatedFamily).toEqual(
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
    })
  })
})
