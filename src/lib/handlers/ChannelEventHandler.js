'use strict';

const EventHandler = require('./EventHandler');

class ChannelEventHandler extends EventHandler {
  constructor(client){
    super(client);
  }

  getUser(evt){
    return evt.message.author;
  }

  getGuild(evt){
    return evt.message.guild;
  }

  getChannel(evt){
    // if(evt instanceof )
    return evt.message.channel;
  }
}

module.exports = ChannelEventHandler;