'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const request = require('request')
const { EventEmitter } = require('events')
const sentry = require('../../sentry')

const RateLimiter = require('./rateLimiters')
const constants = require('./constants')

// const MAX_RETRIES_RIOT_API_UNAVAILABLE = 10
const MAX_RETRIES = 5
const TIME_WAIT_RIOT_API_MS = 100
const SECONDS_IN_MONTH = 2592000

class RequestError extends Error {}
class RateLimitError extends RequestError {
  constructor (time) {
    super('Rate Limit Hit. Slow your Roll')
    this.waitTime = time
  }
}
class UserLimitError extends RateLimitError {}
class ServiceLimitError extends RateLimitError {}
class UnknownLimitError extends RateLimitError {}
class APIUnavailableError extends RequestError {
  constructor () {
    super('Riot API is currently unavailable')
  }
}
class RetryLimitError extends Error {}

class RiotWorker extends EventEmitter {
  constructor ({
    apiKey: optsApiKey = null,
    rateLimits: optsRateLimit = [
      { time: 10, limit: 10 },
      { time: 600, limit: 500 }],
    cache: optsCache = null,
    region: optsRegion = 'na'
  }) {
    super()

    if (optsApiKey === null) {
      throw new Error('\'apiKey\' is a required argument')
    }

    this._limiter = new RateLimiter(optsRateLimit)
    this._workQueue = []
    this._working = false
    this._outstandingRequests = {}
    this._region = optsRegion
    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      rateLimitErrors: 0,
      queueHighWaterMark: 0,
      riotApiUnavailable: 0
    }

    if (optsCache !== null) {
      this._cache = {
        get: params => {
          return new Promise((resolve, reject) => {
            optsCache.get(params, (err, res) => {
              if (err) {
                this._stats.errors++
                this.emit('cacheGetError', err)

                return reject(err)
              }

              if (res === null) {
                this._stats.misses++
              } else {
                this._stats.hits++
                if (res.cacheTime !== null) {
                  return resolve(res)
                } else {
                  if (res === 'none') {
                    res = null
                  }

                  return resolve({
                    value: res,
                    cacheTime: 0,
                    ttl: 0
                  })
                }
              }

              return reject(new Error('Some error occured'))
            })
          })
        },
        set: (params, value) => {
          return new Promise((resolve, reject) => {
            var cacheTime = Date.now()
            var ttl = params.ttl !== null ? params.ttl : 120
            var cacheValue = {
              value: value,
              cacheTime: cacheTime,
              ttl: ttl
            }
            if (params.ttl === null) {
              params.ttl = ttl
            }
            optsCache.set(params, cacheValue, (err, res) => {
              if (err) {
                this._stats.errors++
                this.emit('cacheSetError', err)
                return reject(err)
              }
              return resolve(res)
            })
          })
        },
        destroy: () => {
          if (typeof optsCache.destory === 'function') {
            return optsCache.destroy()
          } else {
            return 0
          }
        }
      }
    } else {
      this._cache = {
        get: params => Promise.resolve(null),
        set: (params, value) => Promise.resolve(null),
        destroy: () => Promise.resolve(null)
      }
      console.log('[Jinx] No caching.... You do live dangerously')
    }
  }

  destroy () { return this._cache.destroy() }

  getStats () {
    return R.clone(this._stats)
  }

  _startWorkThread () {
    if (this._working) {
      return
    }

    this._working = true
    return setImmediate(this._workThread)
  }

  _workThread () {
    if (this._workQueue.length <= 0) {
      this._working = false
      return
    }

    return this._limiter.wait()
    .tap(x => setImmediate(this._workThread))
    .then(x => this._workQueue.shift())
    .then(req => this._doWork(req))
    .catch(err => {
      console.error(`[Jinx] Error in work thread\n${err.stack}`)
      sentry.captureException(err, {
        extra: {
          region: this._region,
          stats: this._stats
        }
      })
    })
  }

  _doWork (req) {
    var p = this._doRequest(req.url)
    if (++req.retries > MAX_RETRIES) {
      p.catch(RequestError, err => {
        return Promise.reject(new RetryLimitError(`${err.message}\nMax retries hit while trying to request data`))
      })
    }
    return p.catch(UserLimitError, ServiceLimitError, err => {
      this._stats.rateLimitErrors++

      return Promise.delay(err.watTime * 1000)
      .then(x => this._doWork(req))
    })
    .catch(APIUnavailableError, () => {
      this._stats.riotApiUnavailable++

      return Promise.delay(TIME_WAIT_RIOT_API_MS)
      .then(x => this._doWork(req))
    })
    .then(data => {
      if (data !== null) {
        return JSON.parse(data)
      } else {
        return null
      }
    })
    .then(req.resolve, req.reject)
  }

  _doRequest (url) {
    return new Promise((resolve, reject) => {
      request({ uri: url, gzip: true }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode === 429) {
          var {
            'retry-after': retryTime,
            'x-rate-limit-type': limitType
          } = res.headers

          if (retryTime && limitType) {
            if (limitType === 'user') {
              return reject(new UserLimitError(retryTime))
            } else if (limitType === 'service') {
              return reject(new ServiceLimitError(retryTime))
            } else {
              return reject(new UnknownLimitError(retryTime))
            }
          }
        } else if (res.statusCode === 404) {
          return resolve(null)
        } else if (res.statusCode === 503) {
          return Promise.reject(new APIUnavailableError())
        }
        return resolve(body)
      })
    })
  }
}

module.exports = RiotWorker
