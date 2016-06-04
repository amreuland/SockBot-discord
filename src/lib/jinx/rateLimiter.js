'use strict'

const Promise = require('bluebird')
// const RateLimit = require('ratelimit.js').RateLimit

// redis.createClient('redis://ws-master.local')
class RateLimiter {
  constructor (cache, limits = [
    {interval: 10, limit: 10},
    {interval: 600, limit: 500}], prefix = 'lolRate') {
    if (!cache || cache === null) {
      throw new Error('RateLimiter requires a redis cache argument')
    }

    this._redisClient = cache
    this._limits = limits
    this._prefix = prefix

    var limiter = new RateLimit(cache, limits, {prefix: prefix})
    limiter.whitelist(['global'])

    this._limiter = limiter
  }

  incur (region) {
    return new Promise((resolve, reject) => {
      this._limiter.incur(region, (err, res) => {

      })
    })
  }

}

module.exports = RateLimiter
