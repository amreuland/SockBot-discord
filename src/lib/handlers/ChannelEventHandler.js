'use strict'

const EventHandler = require('./EventHandler')

class ChannelEventHandler extends EventHandler {

  getUser (evt) { return evt.message.author }

  getGuild (evt) { return evt.message.guild }

  getChannel (evt) { return evt.message.channel }
}

module.exports = ChannelEventHandler
