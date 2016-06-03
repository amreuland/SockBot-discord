'use strict'

const gitRev = require('git-rev')
const conf = require('config')
const raven = require('raven')

var gitRevisionId

gitRev.long(l => {
  gitRevisionId = l
})

var client

console.log('shitshit')

class FakeRaven {
  captureMessage (message, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
      kwargs = {}
    }

    console.log(`[SENTRY] DUMMY: ${message}`)

    if (cb) {
      cb(null)
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
      cb(null)
    }
  }

  captureQuery (query, engine, kwargs, cb) {
    if (!cb && typeof kwargs === 'function') {
      cb = kwargs
    }
    console.log(`[SENTRY] DUMMY: ${query}`)
    if (cb) {
      cb(null)
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

if (conf.sentryDSN && conf.sentryDSN !== '') {
  console.log('Sentry DSN found. Enabling raven')
  client = new raven.Client(conf.sentryDSN, {
    release: gitRevisionId,
    transport: new raven.transports.HTTPSTransport({rejectUnauthorized: false})
  })
} else {
  console.log('No Sentry DSN provided. Error logging with be terrible.')
  client = new FakeRaven()
  client.captureError = client.captureException
}

module.exports = client
