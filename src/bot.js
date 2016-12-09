'use strict'

const Promise = require('bluebird')
const Discordie = require('discordie')
const R = require('ramda')
const conf = require('config')

const sentry = require('./sentry')
const Logger = require('lib/logger')
const ChatHandler = require('lib/handlers/ChatHandler')

const commands = require('commands/')

class Bot {
  constructor () {
    this.token = conf.token
    this.logger = new Logger()

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
    this.logger.log('Trying to connect...')
    this.client.connect({token: this.token})
  }

  handleConnection (evt) {
    this.logger.log(`Connected as: ${this.client.User.username}`)

    this.client.User.setStatus('online', {
      name: 'Left 4 Dead 3'
    })

    this.connected = true
  }

  handleReconnect (evt) {
    this.logger.log('Reconnected')
  }

  handleDisconnect (evt) {
    this.logger.warn('Disconnected!', evt)
    if (this.connected) {
      this.logger.log('The bot has disconnected')
      this.logger.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
    } else {
      this.logger.log('Could not connect into the account')
      this.logger.log('Discord is down or the credentials are wrong.')
      this.logger.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
    }
    connected = false
  }
}

module.exports = Bot
