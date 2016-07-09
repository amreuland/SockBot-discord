'use strict'

class EventHandler {
  // constructor (client) {
  //   this.client = client
  // }

  registerHandler (client) {
    this.client = client
  }

  getClient () {
    return this.client
  }
}

module.exports = EventHandler
