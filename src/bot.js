'use strict'

const Promise = require('bluebird')
const Discordie = require('discordie')

const R = require('ramda')

const Logger = require('./logger')

const conf = require('config')
const sentry = require('./sentry')

class Bot {
  constructor () {
    this.logger = new Logger()
  }

  handleConnection (evt) {
    this.logger.info(`Connected as: ${this.client.User.username}`)

    this.client.User.setStatus('online', {
      name: 'Left 4 Dead 3'
    })

    this.connected = true
  }

  handleReconnect (evt) {
    this.logger.info('Reconnected')
  }

  handleDisconnect (evt) {
    this.logger.warn('Disconnected!')
    this.logger.warn(evt)
  }
}
