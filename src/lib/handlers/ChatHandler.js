'use strict';


const Discord = require('discordie');
const R = require('ramda');
const Promise = require('bluebird');

const conf = require('config');

const M = require('lib/Util').Markdown;
const CommandHandler = require('lib/command/CommandHandler');
const Command = require('lib/command/Command');
const ChannelEventHandler = require('lib/handlers/ChannelEventHandler');

const admins = conf.admins;
const chatPrefix = conf.chat_prefix;

class ChatHandler extends ChannelEventHandler {

  constructor(client){
    super(client);

    this.commands = {};
    this.prefixes = [];
    this.aliases = {};
    this.handler = new CommandHandler();

    this.permissions = {
      MANAGE_PERMISSIONS: null,
      VOICE_MUTE: null
    };
  }

  registerHandler(){
    // console.log(this);
    // var self = this;
    // this.cmdHandler = e => this._handleChat(e);
    this.client.Dispatcher.on(Discord.Events.MESSAGE_CREATE, e => this._handleChat(e));
  }

  destroy() {

  }

  // setCommandPermission(id, permission){
  //   if(this.commands[id] === undefined) return false;
  //   this.commands[id].permission = permission;
  //   return true;
  // }

  registerCommand(cmd) { //defaultPerm
    this.handler.registerCommand(cmd)
  }

  unregisterCommand(id){

  }

  _processReturn(evt, obj){
    if(R.is(String, obj) || R.is(Number, obj)) evt.message.channel.sendMessage(obj); return;
    if(Buffer.isBuffer(obj)) evt.message.channel.uploadFile(obj, 'file.png'); return;
    if(R.is(Object, obj) && obj.upload) evt.message.channel.uploadFile(obj.upload, obj.filename); return;
  }

  _handleChat(evt){

    if(!evt.message) return;
    if(this.client.User.id === evt.message.author.id) return;

    if(!admins[evt.message.author.id]) return;
    var content;
    if(evt.message.content.indexOf(chatPrefix) === 0){
      content = evt.message.content.substring(chatPrefix.length);
    // }else if (this.client.User.isMentioned(evt.message)) {
    //   // if(evt.message.content.split(/\s+/)[1])
    //   return; 
    }else{
      return;
    }
    var args = content.trim().split(/\s+/);
    
    // if(args.length < 1) return;
    // var alias = args.shift().toLowerCase();
    
    // if(!this.aliases[alias]) return;
    
    // var cmd = this.aliases[alias];
    // var command = this.commands[cmd];
    
    var ret = this.handler.run(this, evt, args);

    if(ret instanceof Promise){
      ret.then(res => {
        if(!res) return;
        if(R.is(Array, res)){
          return R.forEach(r => this._processReturn(evt, r), res)
        }
        this._processReturn(evt, res);
      })
      .catch(Command.UnknownCommandError, err => {
        var stack = R.join('->', err.getChain());
        evt.message.channel.sendMessage(M.code(`SockOS: '${stack}': No Such Command`))
        return err;
      })
      .catch(Command.UsageError, err => {
        var header = `${R.join('\n', R.map(r => `\t${r}`, err.errs))}`;
        var stack = `${
          R.join(' ', err.getChain())
        } ${R.join(' ', R.map(r => `(${r})`, err.getParams()))}`;
        
        evt.message.channel.sendMessage(M.code(`Usage:  ${chatPrefix}${stack}\n${header}`));
        return err;
      })
      .catch(err => {
        if(err instanceof Error) return evt.message.channel.sendMessage(M.code(err.stack));
        evt.message.channel.sendMessage(M.code(err));
        // return 
      })
      // .done(err => {
      //   throw err;
      // });
    }
  }
}


module.exports = ChatHandler;
