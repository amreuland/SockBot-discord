'use strict'

const conf = require('config')
const raven = require('raven')

var client

console.log('shitshit')

class FakeRaven {
  captureMessage (message, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
      kwargs = {}
    }

    console.log(`[SENTRY] DUMMY: ${message}`)

    cb && cb(null)
    return null
  }

  captureException (err, kwargs, cb) {
    if (!(err instanceof Error)) {
      err = new Error(err)
    }
    console.error('[SENTRY] DUMMY')
    console.error(err.stack)
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
      kwargs = {}
    }
    cb && cb(null)
  }

  captureQuery (query, engine, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
      kwargs = {}
    }
    console.log(`[SENTRY] DUMMY: ${query}`)
    cb && cb(null)
    return null
  }

  setUserContext (user) {}

  setExtraContext (extra) {
    return this
  }

  setTagsContext (tags) {
    return this
  }

  patchGlobal (cb) {
    throw new Error('FAKE SENTRY MODULE! CANNOT PATCH GLOBAL!')
  }
}

if (conf.sentry.dsn && conf.sentry.dsn !== '') {
  console.log('Sentry DSN found. Enabling raven')
  client = new raven.Client(conf.sentry.dsn)
} else {
  console.log('No Sentry DSN provided. Error logging with be terrible.')
  client = new FakeRaven()
  client.captureError = client.captureException
}

module.exports = client
