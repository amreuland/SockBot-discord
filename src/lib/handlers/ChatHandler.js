'use strict'

const Discord = require('discordie')
const R = require('ramda')
const Promise = require('bluebird')
const moment = require('moment')
const conf = require('config')

const { Markdown: M, SplitString: splitter } = require('lib/StringUtils')
const CommandGroup = require('lib/command/CommandGroup')
const { CategoryCommand, HelpCommand } = require('lib/command/Command')
const ChannelEventHandler = require('lib/handlers/ChannelEventHandler')
const CmdErrs = require('lib/command/Errors')

// const admins = conf.admins
const chatPrefix = conf.chat_prefix

class ChatHandler extends ChannelEventHandler {

  constructor (client) {
    super(client)

    this.commands = {}
    this.prefixes = []
    this.aliases = {}
    this.handler = new CommandGroup({id: 'null'})

    this.handler.registerCommand(new CategoryCommand())
    this.handler.registerCommand(new HelpCommand())
  }

  registerHandler () {
    // console.log(this);
    // var self = this;
    // this.cmdHandler = e => this._handleChat(e);
    this.client.Dispatcher.on(Discord.Events.MESSAGE_CREATE, e => this._handleChat(e))
  }

  destroy () {

  }

  sendTyping (evt) {
    evt.message.channel.sendTyping()
  }

  finalize () {
    this.handler.finalize()
  }

  registerCommand (cmd) {
    this.handler.registerCommand(cmd)
  }

  // unregisterCommand (id) {}

  _processReturn (evt, obj) {
    if (R.is(String, obj) || R.is(Number, obj)) {
      evt.message.channel.sendMessage(obj)
      return
    }

    if (Buffer.isBuffer(obj)) {
      evt.message.channel.uploadFile(obj, 'file.png')
      return
    }

    if (R.is(Object, obj) && obj.upload) {
      evt.message.channel.uploadFile(obj.upload, obj.filename)
      return
    }
  }

  _handleChat (evt) {
    if (!evt.message) return
    if (this.client.User.id === evt.message.author.id) return

    // if(!admins[evt.message.author.id]) return;
    var content
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${evt.message.author.username}: ${evt.message.content}`)
    if (evt.message.content.indexOf(chatPrefix) === 0) {
      content = evt.message.content.substring(chatPrefix.length)
    // }else if (this.client.User.isMentioned(evt.message)) {
    //   // if(evt.message.content.split(/\s+/)[1])
    //   return;
    } else {
      return
    }

    var args = splitter(content)

    var ret = this.handler.run(this, evt, args)

    if (ret instanceof Promise) {
      ret.then(res => {
        if (!res) return
        if (R.is(Array, res)) {
          return R.forEach(r => this._processReturn(evt, r), res)
        }
        this._processReturn(evt, res)
      })
      .catch(CmdErrs.UnknownCommandError, err => {
        var stack = R.join('->', err.getChain())
        evt.message.channel.sendMessage(M.code(`SockOS: '${stack}': No Such Command`))
        return err
      })
      .catch(CmdErrs.UsageError, err => {
        var stack = R.join(' ', err.getChain())
        var params = R.join(' ', R.map(M.inline, err.getParams()))
        var errs = R.join('\n', R.map(r => `\t ${r}`, err.errs))

        evt.message.channel.sendMessage(`Usage:  ${
          M.inline(chatPrefix)
        }${M.boldInline(stack)}  ${params}\n${errs}`)

        return err
      })
      .catch(err => {
        if (err instanceof Error) return evt.message.channel.sendMessage(M.code(err.stack))
        evt.message.channel.sendMessage(M.code(err))
        // return
      })
      // .done(err => {
      //   throw err;
      // });
    }
  }
}

module.exports = ChatHandler
