'use strict'

const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const ld = require('lodash')
const R = require('ramda')
const request = require('request')
const { EventEmitter } = require('events')

const constants = require('./constants')
const RateLimiter = require('./rateLimiter')

const MAX_RETRIES_RIOT_API_UNAVAILABLE = 10
const TIME_WAIT_RIOT_API_MS = 100
const SECONDS_IN_MONTH = 2592000

class RiotWorker extends EventEmitter {
  constructor ({
    apiKey: optsApiKey = null,
    rateLimits: optsRateLimit = [{ time: 10, limit: 10 }, { time: 600, limit: 500 }],
    cache: optsCache = null
  }) {
    super()

    if (optsApiKey === null) {
      throw new Error('apiKey required')
    }

    this._rateLimiter = new RateLimiter(optsRateLimit)
    this._queuedRequests = []
    this._outstandingRequests = {}
    this.processingRequests = false
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
                  resolve({
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

        },
        destroy: () => {
          if (typeof optsCache.destory === "function") {
            return optsCache.destroy()
          } else {
            return 0
          }
        }
      }
    } else {
      this.cache = {
        get: params => Promise.resolve(null),
        set: (params, value) => null,
        destroy: () => null
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
    if (params.retries === null) {
      params.retries = 0
    }

    var url = params.url
    var caller = params.caller
    var retries = params.retries
    var allowRetries = params.allowRetries || true
    return new Promise((resolve, reject) => {
      request({ uri: url, gzip: true }, (err, res, body) => {

      })
    })
  }
}

module.exports = RiotWorker
