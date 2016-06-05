'use strict'

const Promise = require('bluebird')
const { EventEmitter } = require('events')
const R = require('ramda')

const constants = require('./constants')
const RequestWorker = require('./worker')

class Jinx extends EventEmitter {
  constructor ({
    apiKey: optsApiKey = null,
    cache: optsCache = null,
    rateLimits: optsRateLimits = [
      { interval: 10, limit: 10 },
      { interval: 600, limit: 500 }]
  }) {
    super()

    if (optsApiKey === null) {
      throw new Error('\'apiKey\' is a required argument')
    }

    this._key = optsApiKey

    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0
    }

    this._reqWorkers = R.compose(R.fromPairs, R.map(region => {
      return [region, new RequestWorker({
        region,
        rateLimits: optsRateLimits
      })]
    }), R.keys)(constants.regions)

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
            return optsCache.quit()
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

  _makeRequest (params) {
    var worker = this._reqWorkers[params.region]

  }

  _makeCachedRequest (params) {

  }
}

module.exports = Jinx
