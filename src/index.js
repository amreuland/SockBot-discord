'use strict'

const Promise = require('bluebird')
const Discordie = require('discordie')
// const path = require('path')
// const fs = require('fs')
const R = require('ramda')
const conf = require('config')
const sentry = require('./sentry')

// const GoogleTTS = require('lib/GoogleTTS')
const ChatHandler = require('lib/handlers/ChatHandler')
// const { Markdown: M } = require('lib/StringUtils')
// const { SimpleCommand, TextCommand, UsageError } = require('lib/command/Command')
// const CommandGroup = require('lib/command/CommandGroup')

const commands = require('commands/')
// console.log(commands)

// let timeoutTime = 10000

let client = new Discordie({
  autoReconnect: true
})

client.bot = true

let chatHandler = new ChatHandler(client)

R.forEach(cmd => chatHandler.registerCommand(cmd), commands)

chatHandler.finalize()

// var GTTS

// let channelMap = {}

// let keepRunning = true

// let announceQueue = []

let connected = false

function init () {
  client.Dispatcher.once(Discordie.Events.GATEWAY_READY, handleConnection)
  client.Dispatcher.on(Discordie.Events.GATEWAY_RESUMED, handleReconnect)
  client.Dispatcher.on(Discordie.Events.DISCONNECTED, handleDisconnection)

  chatHandler.registerHandler(client)

  connect()
}

function connect () {
  // client.Dispatcher.removeListener(Discordie.Events.GATEWAY_READY, handleConnection)
  // client.Dispatcher.removeListener(Discordie.Events.DISCONNECTED, handleDisconnection)
  // client.Dispatcher.once(Discordie.Events.GATEWAY_READY, handleConnection)
  // client.Dispatcher.once(Discordie.Events.DISCONNECTED, handleDisconnection)

  console.log('Trying to connect...')
  client.connect({token: conf.token})
}

function handleConnection (evt) {
  console.log(`Connected as: ${client.User.username}`)

  client.User.setStatus('online', {
    name: 'Left 4 Dead 3'
  })

  connected = true
}

function handleReconnect (evt) {
  console.log(`Reconnected`)
}

function handleDisconnection (evt) {
  console.log('DISCONNECTED!!!!!')
  console.log(evt)
  if (connected) {
    console.log('The bot has disconnected')
    console.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
  } else {
    console.log('Could not connect into the account')
    console.log('Discord is down or the credentials are wrong.')
    console.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
  }
  connected = false
}

init()
