'use strict'

const EventHandler = require('./EventHandler')

class ClientEventHandler extends EventHandler {

  getAuthor (evt) { return evt.message.author }

  getGuild (evt) { return evt.message.guild }
}

module.exports = ClientEventHandler
