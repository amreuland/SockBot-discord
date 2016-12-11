'use strict'

const Promise = require('bluebird')
const Discordie = require('discordie')
const R = require('ramda')

const Sentry = require('lib/sentry')
const Logger = require('lib/logger')

const ChatHandler = require('lib/handlers/ChatHandler')

const commands = require('commands/')

class Bot {
  constructor (config) {
    this.config = config
    // this.token = config.token
    this.log = new Logger()

    this.sentry = new Sentry(this)

    this.sentry.captureException(new Error('HI'))
    this.client = new Discordie({
      autoReconnect: true
    })

    this.client.bot = true

    this.chatHandler = new ChatHandler(this)

    this.client.Dispatcher.once(Discordie.Events.GATEWAY_READY, evt => this.handleConnection(evt))
    this.client.Dispatcher.on(Discordie.Events.GATEWAY_RESUMED, evt => this.handleReconnect(evt))
    this.client.Dispatcher.on(Discordie.Events.DISCONNECTED, evt => this.handleDisconnect(evt))

    R.forEach(cmd => this.chatHandler.registerCommand(cmd), commands)

    this.chatHandler.finalize()

    this.connected = false
    this.connect()
  }

  connect () {
    this.log.info('Trying to connect...')
    this.client.connect({token: this.config.token})
  }

  getSentry () {
    return this.sentry
  }

  handleConnection (evt) {
    this.log.log(`Connected as: ${this.client.User.username}`)

    this.client.User.setStatus('online', {
      name: 'Left 4 Dead 3'
    })

    this.connected = true
  }

  handleReconnect (evt) {
    this.log.info('Reconnected')
  }

  handleDisconnect (evt) {
    this.log.warn('Disconnected!', evt)
    if (this.connected) {
      this.log.info('The bot has disconnected')
      this.log.info(`Trying to reconnect in ${evt.delay} milliseconds...`)
    } else {
      this.log.info('Could not connect into the account')
      this.log.info('Discord is down or the credentials are wrong.')
      this.log.info(`Trying to reconnect in ${evt.delay} milliseconds...`)
    }
    this.connected = false
  }
}

module.exports = Bot
