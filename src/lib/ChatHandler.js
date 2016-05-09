"use strict";

var Discord = require('discordie');
// var EventHandler = require('')

var admins = {
  '144600822737534976': 'Austin',
  '148647353686032384': 'Dakota'
}

const chatPrefix = ']';

class ChatHandler {
  
  constructor(bot){
    this.bot = bot;
    this.commands = {};
    this.prefixes = [];
    this.aliases = {};

    

    this.permissions = {
      MANAGE_PERMISSIONS: null,
      VOICE_MUTE: null
    };
  }

  register(){
    this.cmdHandler = this.createHandlerCommand();
    this.bot.Dispatcher.on(Discord.Events.MESSAGE_CREATE, this.cmdHandler);
  }

  destroy() {

  }

  setCommandPermission(id, permission){
    if(this.commands[id] === undefined) return false;
    this.commands[id].permission = permission;
    return true;
  }

  registerCommand(id, aliases, runnable) { //defaultPerm
    
    if(this.commands[id] !== undefined){
      throw new Error(`Command with id '${id}' already exists`);
    }

    aliases = aliases || [];
    if(aliases.indexOf(id) < 0){
      aliases.push(id);
    }

    this.commands[id] = {
      alias: aliases,
      run: runnable,
      // permission: defaultPerm
    }

    aliases.forEach(alias => {
      if(this.aliases[alias] !== undefined){
        throw new Error(`Alias '${alias}'already exists (${this.aliases[alias]})`)
      }
      this.aliases[alias] = id;
    });
  }

  unregisterCommand(id){
    var aliases = this.commands[id].aliases;
    aliases.forEach(alias => delete this.aliases[alias]);
    delete this.commands[id];
  }

  createHandlerCommand(){
    return (e) => {
      if(!e.message) return;
      if(this.bot.User.id === e.message.author.id) return;
      if(!admins[e.message.author.id]) return;
      var content;
      if(e.message.content.indexOf(chatPrefix) === 0){
        content = e.message.content.substring(chatPrefix.length);
      // }else if (this.bot.User.isMentioned(e.message)) {
      //   // if(e.message.content.split(/\s+/)[1])
      //   return; 
      }else{
        return;
      }
      var args = content.trim().split(/\s+/);
      if(args.length < 1) return;
      var alias = args.shift().toLowerCase();
      if(!this.aliases[alias]) return;
      var cmd = this.aliases[alias];
      var command = this.commands[cmd];
      command.run(this, e, args);
    }

  }

  reply(e, str){
    e.message.channel.sendMessage(str);
  }

  getBot(){
    return this.bot;
  }

  getChannel(e){
    // if(e instanceof )
    return e.message.channel;
  }

  getAuthor(e){
    return e.message.author;
  }

  getGuild(e){
    return e.message.guild;
  }




}


module.exports = function(bot){
  return new ChatHandler(bot);
}
