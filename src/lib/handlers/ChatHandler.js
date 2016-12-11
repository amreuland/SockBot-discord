'use strict'

const Discordie = require('discordie')
const R = require('ramda')
const Promise = require('bluebird')

const { Markdown: M, SplitString: splitter } = require('lib/StringUtils')
const CommandGroup = require('lib/command/CommandGroup')
const { CategoryCommand, HelpCommand, UnknownCommandError, UsageError } = require('lib/command/Command')

const ChannelEventHandler = require('lib/handlers/ChannelEventHandler')

class ChatHandler extends ChannelEventHandler {

  constructor (bot) {
    super(bot)

    this.chatPrefix = this.bot.config.chat_prefix
    this.commands = {}
    this.prefixes = []
    this.aliases = {}
    this.handler = new CommandGroup({name: null})

    // this.handler.registerCommand(new CategoryCommand())
    this.handler.registerCommand(new HelpCommand())

    this.registerHandler()
  }

  registerHandler () {
    // super.registerHandler(client)
    // console.log(this);
    // let self = this;
    // this.cmdHandler = e => this._handleChat(e);
    this.getClient().Dispatcher.on(Discordie.Events.MESSAGE_CREATE, evt => this._handleChat(evt))
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
      // evt.message.channel.sendTyping()
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
    if (!evt.message) {
      return
    }

    if (this.getClient().User.id === evt.message.author.id) {
      return
    }

    // if(!admins[evt.message.author.id]) return;
    let content
    // console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${evt.message.author.username}: ${evt.message.content}`)
    this.getLogger().info(evt.message.author.username, ':', evt.message.content)
    if (evt.message.content.indexOf(this.chatPrefix) === 0) {
      content = evt.message.content.substring(this.chatPrefix.length)
    // }else if (this.getClient().User.isMentioned(evt.message)) {
    //   // if(evt.message.content.split(/\s+/)[1])
    //   return;
    } else {
      return
    }

    let args = splitter(content)

    let ret = this.handler.process(this, evt.message, args)

    if (ret instanceof Promise) {
      ret.then(res => {
        if (!res) return
        if (R.is(Array, res)) {
          return R.forEach(r => this._processReturn(evt, r), res)
        }
        this._processReturn(evt, res)
      })
      .catch(UnknownCommandError, err => {
        let stack = R.join('->', err.getChain())
        evt.message.channel.sendMessage(M.code(`SockOS: '${stack}': No Such Command`))
        return err
      })
      .catch(UsageError, err => {
        let stack = R.join(' ', err.getChain())
        let params = R.join(' ', R.map(M.inline, err.getParams()))
        let errs = R.join('\n', R.map(r => `\t ${r}`, err.errs))

        evt.message.channel.sendMessage(`Usage:  ${
          M.inline(this.chatPrefix)
        }${M.boldInline(stack)}  ${params}\n${errs}`)

        return err
      })
      .catch(err => {
        this.bot.sentry.captureError(err)
        if (err instanceof Error) {
          return evt.message.channel.sendMessage(M.code(err.stack))
        }

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
