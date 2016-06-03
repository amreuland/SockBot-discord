'use strict'

const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const R = require('ramda')
const request = require('request')
const { EventEmitter } = require('events')

const constants = require('./constants')
const RateLimiter = require('./rateLimiter')

const MAX_RETRIES_RIOT_API_UNAVAILABLE = 10
const TIME_WAIT_RIOT_API_MS = 100
const SECONDS_IN_MONTH = 2592000

class RateLimitError extends Error {}
class UserLimitError extends RateLimitError {}
class ServiceLimitError extends RateLimitError {}
class UnknownLimitError extends RateLimitError {}
class APIUnavailableError extends Error {}

class RiotWorker extends EventEmitter {
  constructor ({
    apiKey: optsApiKey = null,
    rateLimits: optsRateLimit = [{ time: 10, limit: 10 }, { time: 600, limit: 500 }],
    cache: optsCache = null,
    region: optsRegion = 'na'
  }) {
    super()

    if (optsApiKey === null) {
      throw new Error('apiKey required')
    }

    this._workerQueue = []

    this._rateLimiter = new RateLimiter(optsRateLimit)
    this._queuedRequests = []
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
      this.cache = {
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
      this.cache = {
        get: params => Promise.resolve(null),
        set: (params, value) => Promise.resolve(null),
        destroy: () => Promise.resolve(null)
      }
    }
  }

  destroy () { return this.cache.destroy() }

  getStats () {
    // return ld.merge({}, this._stats, {
    //   queueLength: this._queuedRequests.length
    // })
    return null
  }

  _doRequest (params) {
    var url = params.url

    return new Promise((resolve, reject) => {
      request({ uri: url, gzip: true }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode === 429) {
          this._stats.rateLimitErrors++
          params.retries++
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
      })
    })
  }
}

module.exports = RiotWorker
