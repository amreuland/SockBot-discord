'use strict'

// const gitRevSync = require('git-rev-sync')
const conf = require('config')
const raven = require('raven')

// const gitRevisionId = gitRevSync.long()

var client

class FakeRaven {
  captureMessage (message, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
      kwargs = {}
    }

    console.log(`[SENTRY] DUMMY: ${message}`)

    if (cb) {
      return cb(null)
    }
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
    }
    if (cb) {
      return cb(null)
    }
  }

  captureQuery (query, engine, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
    }
    console.log(`[SENTRY] DUMMY: ${query}`)
    if (cb) {
      return cb(null)
    }
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
  client = new raven.Client(conf.sentry.dsn, {
//    release: gitRevisionId,
    transport: new raven.transports.HTTPSTransport({rejectUnauthorized: false})
  })
} else {
  console.log('No Sentry DSN provided. Error logging with be terrible.')
  client = new FakeRaven()
  client.captureError = client.captureException
}

module.exports = client
