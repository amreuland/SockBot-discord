'use strict'

const chalk = require('chalk')
const util = require('util')
const moment = require('moment')
const R = require('ramda')

const DEFAULT = require('./defaults')

function write (logFn, logAt, prefix) {
  return function _writeLogToConsole () {
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

function wrap (logger, options) {
  let _CallableLogger = write(logger.debg, 'debug', options)

  DEFAULT.METHODS.forEach(function (logAt) {
    let prefix = '[' + chalk[DEFAULT.COLORS[logAt]](DEFAULT.PREFIXES[logAt]) + ']'
    _CallableLogger[logAt] = write(logger[logAt], logAt, prefix)
  })

  return _CallableLogger
}

module.exports = function CaptainsLog (overrides) {
  let _stdout = console.log.bind(console)
  let _stderr = console.error.bind(console)

  let logger = {
    fatal: _stderr,
    critical: _stderr,
    warn: _stdout,
    debug: _stderr,
    info: _stdout,
    log: _stdout,
    silly: _stdout,
    blank: _stdout
  }

  return wrap(logger)
}
