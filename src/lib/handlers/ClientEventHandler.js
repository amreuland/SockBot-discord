'use strict';

const EventHandler = require('./EventHandler')

class ClientEventHandler extends EventHandler {
  constructor(client){
    super(client);
  }

  getAuthor(evt){
    return evt.message.author;
  }

  getGuild(evt){
    return evt.message.guild;
  }
}