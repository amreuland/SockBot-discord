'use strict';

const EventHandler = require('./EventHandler')

class UserEventHandler extends EventHandler {
  constructor(client){
    super(client);
  }
}

module.exports = UserEventHandler;