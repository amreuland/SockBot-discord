'use strict'

const { EventEmitter } = require('events')

class RateLimiter extends EventEmitter {
  constructor (limits) {
    super()
    this._limits = limits
    this._waitTime = 0
    this._canProcess = true
  }

  wait (time) {
    var t = tim * 1000
  }
}

module.exports = RateLimiter
