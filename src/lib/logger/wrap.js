'use strict'

const chalk = require('chalk')
const write = require('./write')
const DEFAULT = require('./defaults')

module.exports = function _wrap (logger, options) {
  let _CallableLogger = write(logger.debg, 'debug', options)

  DEFAULT.METHODS.forEach(function (logAt) {
    let prefix = '[' + chalk[DEFAULT.COLORS[logAt]](DEFAULT.PREFIXES[logAt]) + ']'
    _CallableLogger[logAt] = write(logger[logAt], logAt, prefix)
  })

  return _CallableLogger
}
