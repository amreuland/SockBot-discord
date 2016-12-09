'use strict'

const wrap = require('./wrap')
const lowLevel = require('./lowLevel')
// const configure = require('./configure')

module.exports = function CaptainsLog (overrides) {
  // let options = configure(overrides)
  let logger = lowLevel()

  let callableLogger = wrap(logger)

  return callableLogger
}
