'use strict'

const { Pair } = require('./pair')
const { State, pure, modify, gets, get, put } = require('./state')

module.exports.Pair = Pair
module.exports.State = State
module.exports.get = get
module.exports.gets = gets
module.exports.modify = modify
module.exports.pure = pure
module.exports.put = put
