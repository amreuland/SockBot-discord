'use strict'

module.exports = function LowLevelLogger () {
  let _stdout = console.log.bind(console)
  let _stderr = console.error.bind(console)

  return {
    fatal: _stderr,
    critical: _stderr,
    warn: _stdout,
    debug: _stderr,
    info: _stdout,
    silly: _stdout,
    blank: _stdout
  }
}
