'use strict'

// const gitRevSync = require('git-rev-sync')
const R = require('ramda')
const raven = require('raven')

// const gitRevisionId = gitRevSync.long()

class Sentry extends raven.Client {
  constructor (bot) {
    // this.bot = bot
    // this.config = bot.config

    let dsn = process.env.SENTRY_DSN || bot.config.sentry.dsn || ''

    let hasClient = true
    // let isEnabled = true

    if (dsn === '') {
      bot.log.warn('No Sentry DSN provided. Error logging will be terrible.')
      // isEnabled = false
      hasClient = false
    }

    if (hasClient) {
      let sentryOpts = bot.config.sentry.options || {}

      let env = process.env.NODE_ENV || process.env.SENTRY_ENVIRONMENT || bot.config.env || 'development'

      bot.log.debug(`Running in a ${env} environment`)

      let defOptions = {
        environment: env,
        transport: new raven.transports.HTTPSTransport({rejectUnauthorized: false})
      }

      sentryOpts = R.merge(defOptions, sentryOpts)

      bot.log.debug('Creating sentry client (Raven)...')

      super(dsn, sentryOpts)

      bot.log.debug('Setting Raven handlers...')

      this.patchGlobal()
    } else {
      super(null)
    }

    this.hasClient = hasClient
    this.isEnabled = hasClient
    this.bot = bot
  }

  getEnabled () {
    return (this.hasClient && this.isEnabled)
  }

  setEnabled (enabled) {
    this.isEnabled = (enabled && this.hasClient)
  }
}

module.exports = Sentry
