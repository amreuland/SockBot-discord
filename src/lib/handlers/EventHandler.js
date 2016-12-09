'use strict'

class EventHandler {
  constructor (bot) {
    this.bot = bot
  }

  // registerHandler (bot) {
  //   this.bot = bot
  // }

  getBot () {
    return this.bot
  }

  getLogger () {
    return this.bot.logger
  }

  getClient () {
    return this.bot.client
  }
}

module.exports = EventHandler
