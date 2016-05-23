'use strict'

const conf = require('config')
const raven = require('raven')

var client

if (conf.sentry.dsn && conf.sentry.dsn !== '') {
  console.log('Sentry DSN found. Enabling raven')
  client = new raven.Client(conf.sentry.dsn)
} else {
  console.log('No Sentry DSN provided. Error logging with be terrible.')
  client = {
    captureException: (err, kwargs, cb) => {
      if (!(err instanceof Error)) {
        err = new Error(err)
      }
    },
    captureMessage: (message, kwargs, cb) => {
      if (!cb && typeof kwargs === 'function') {
        cb = kwargs
        kwargs = {}
      }
      var result = null
      cb && cb(result)
      return result
    }
  }

  client.captureError = client.captureException
}

module.exports = client
