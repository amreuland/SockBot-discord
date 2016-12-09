'use strict'

const util = require('util')
const moment = require('moment')
const R = require('ramda')

module.exports = function wrap (logFn, logAt, prefix) {
  return function _writeLogToConsole () {
    // let lvlMap = options.logLevels

    // let configuredLvl = options.level

    // if (lvlMap[logAt] < lvlMap[configuredLvl]) {
    //   return
    // }

    let args = Array.prototype.slice.call(arguments)

    let pieces = []
    R.forEach(arg => {
      if (R.is(Error, arg) && arg.stack && !arg.inspect) {
        pieces.push(arg.stack)
      } else if (!R.is(String, arg)) {
        pieces.push(util.inspect(arg))
        return
      } else {
        pieces.push(arg)
      }
    }, args)

    let timeStr = '[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'
    let prefixStr = prefix
    let str = timeStr + prefixStr + util.format.apply(util, pieces)

    return logFn.apply(logFn, [str])
  }
}
