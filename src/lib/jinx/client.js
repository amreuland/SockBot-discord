'use strict'

const Promise = require('bluebird')
const R = require('ramda')

const sentry = require('../../sentry')
const constants = require('./constants')
const {
  RequestWorker,
  BadRequestError,
  UnauthorizedError
} = require('./worker')

const getStringMaker = R.compose(R.join('&'), R.map(R.join('=')), R.toPairs)

class Jinx {
  constructor ({
    apiKey: optsApiKey = null,
    cache: optsCache = null,
    rateLimits: optsRateLimits = [
      { interval: 10, limit: 10 },
      { interval: 600, limit: 500 }]
  }) {
    if (optsApiKey === null) {
      throw new Error('\'apiKey\' is a required argument')
    }

    this._key = optsApiKey

    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      workerErrors: 0,
      cacheErrors: 0
    }

    this._reqWorkers = R.compose(R.fromPairs, R.map(region => {
      return [region, new RequestWorker({
        region,
        rateLimits: optsRateLimits
      })]
    }), R.keys)(constants.regions)

    if (optsCache !== null) {
      this._cache = {
        get: key => new Promise((resolve, reject) => {
          optsCache.get(key, (err, res) => {
            if (err) {
              this._stats.errors++
              this._stats.cacheErrors++
              return reject(err)
            }
            return resolve(res)
          })
        }),

        set: (key, value, ttl = 120) => new Promise((resolve, reject) => {
          var cacheValue = JSON.stringify(value)
          optsCache.set(key, cacheValue, (err, res) => {
            if (err) {
              this._stats.errors++
              this._stats.cacheErrors++
              return reject(err)
            }
            optsCache.expire(key, ttl)
            return resolve(res)
          })
        }),

        destroy: () => new Promise((resolve, reject) => {
          var res = 0
          try {
            if (typeof optsCache.destory === 'function') {
              res = optsCache.quit()
            }
          } catch (err) {
            return reject(err)
          }
          return resolve(res)
        })
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
    var workers = R.map(w => w.getStats(), this._reqWorkers)
    return {
      stats: this._stats,
      workers
    }
  }

  _makeRequest (params) {
    var region = params.region
    var queryParams = params.queryParams || {}

    var url = `${params.url}?${getStringMaker(queryParams)}`
    var worker = this._reqWorkers[region]

    return worker.makeRequest(`${url}&api_key=${this._key}`)
    .then(JSON.parse)
    .catch(BadRequestError, UnauthorizedError, err => {
      this._stats.errors++

      if (err instanceof BadRequestError) {
        this._stats.workerErrors++
      }

      sentry.captureException(err, {
        extra: {
          region, url, queryParams,
          clientStats: this._stats,
          apiMethod: params.caller,
          restEndpoint: params.rest,
          hasApiKey: this._key !== null
        },
        tags: { lib: 'jinx' },
        level: 'warning'
      })
    })
  }

  _makeCachedRequest (params) {
    var cacheParams = params.cache
    var cacheKey = `jinx-${params.region}-${cacheParams.key}`
    this._cache.get(cacheKey)
    .then(cacheRes => {
      if (cacheRes === null) {
        return this._makeRequest(params)
        .then(reqRes => {
          if (reqRes !== null || (reqRes === null && cacheParams.saveIfNull === true)) {
            return this._cache.set(cacheKey, reqRes, cacheParams.ttl || 120)
          }
        })
      } else {
        return cacheRes
      }
    })
  }
}

module.exports = Jinx
