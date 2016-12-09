'use strict'

const Promise = require('bluebird')
const Discordie = require('discordie')
const R = require('ramda')
const { Markdown: M } = require('lib/StringUtils')

class CommandError extends Error {
  constructor (args) {
    args = args || ''
    if (R.is(String, args)) {
      args = { message: args }
    }

    super(args.message)
    this.cmdChain = (args.chain ? [args.chain] : [])
  }
  addParent (alias) { this.cmdChain.unshift(alias) }
  getChain () { return this.cmdChain }
}

class CommandStateError extends CommandError {}

class UnknownCommandError extends CommandError {
  constructor (args) {
    super('Unknown Command')
    this.cmdChain = [args]
  }
}

class UsageError extends CommandError {
  constructor (args) {
    super('UsageError')
    this.errs = (R.is(Array, args) ? args : [args])
    this.parms = []
    this.beenSet = false
  }

  setParams (parms) {
    if (this.beenSet) return
    this.parms = parms
    this.beenSet = true
  }
  getParams () { return this.parms }
}

class HelpTextError extends CommandError {
  constructor () {
    super('HelpTextError')
    // this.cmdChain = []
    // this.parameters =
    // this.description =
  }
}

class Command {
  constructor (id, options) {
    if (R.is(Object, id)) {
      options = id
      id = options.id
      // runner = options.runner
    }

    this.id = id
    this.description = options.desc || options.description || ''
    this.usage = options.usage || ''
    this.aliases = options.aliases || []
    this.parameters = options.parameters || []
    this.categories = options.categories || []

    this.parent = null

    if (R.is(String, this.aliases)) {
      this.aliases = [this.aliases]
    }

    if (!R.contains(this.id, this.aliases)) {
      this.aliases.push(this.id)
    }

    if (R.is(String, this.parameters)) {
      this.parameters = [this.parameters]
    }

    this.reqs = options.reqs || {}

    if (!this.reqs.userIds) {
      this.reqs.userIds = []
    }

    if (!this.reqs.permissions) {
      this.reqs.permissions = []
    }

    if (!this.reqs.roleIds) {
      this.reqs.roleIds = []
    }

    if (!this.reqs.roleNames) {
      this.reqs.roleNames = []
    }

    this.deleteCommand = !!options.deleteCommand
    this.dmOnly = !!options.dmOnly
    this.guildOnly = !!options.guildOnly

    this.cooldown = options.cooldown || 0
    this.cooldownMessage = options.cooldownMessage || false
    this.permissionMessage = options.permissionMessage || false

    // if (this.cooldown !== 0) {
    this.usersOnCooldown = new Set()
    // }

    // if (typeof runner === 'string') {
    //   this.response = runner
    //   this.execute = () => this.response
    // } else if (R.isArray(runner)) {
    //   // Do a thing
    // } else if (typeof runner === 'function') {
    //   this.execute = runner
    // } else {
    //   throw new Error('Invalid command generator')
    // }
  }

  permissionCheck (message) {
    let req = false
    if (this.reqs.userIds.length > 0) {
      req = true
      if (~this.reqs.userIds.indexOf(message.author.id)) {
        return true
      }
    }

    if (message.isPrivate === true) {
      return !this.guildOnly && !req
    } else if (this.dmOnly) {
      return false
    }

    // let keys = R.keys(this.reqs.permissions)
    if (this.reqs.permissions.length > 0) {
      req = true
      for (let perm of this.reqs.permissions) {
        if (!message.author.can(perm, message.channel)) {
          req = false
          break
        }
      }

      if (req) {
        return true
      }

      req = true
    }

    if (message.member && message.member.roles.length > 0) {
      let roles = message.member.roles

      if (this.reqs.roleIds.length > 0) {
        req = true
        for (let roleId of this.reqs.roleIds) {
          if (~roles.indexOf(roleId)) {
            return true
          }
        }
      }

      // if (this.reqs.roleNames.length > 0) {
      //   req = true
      //   roles = R.map(roleId => message.guild.)
      // }
    }

    return !req
  }

  cooldownCheck (userId) {
    if (this.cooldown === 0) {
      return true
    }

    if (this.usersOnCooldown.has(userId)) {
      return false
    }

    this.usersOnCooldown.add(userId)
    setTimeout(() => this.usersOnCooldown.delete(userId), this.cooldown)
    return true
  }

  process (handler, message, args) {
    if (this.deleteCommand &&
      !message.isPrivate &&
      handler.client.User.can(Discordie.Permissions.Text.MANAGE_MESSAGES, message.channel)) {
      message.delete()
    }

    if (!this.permissionCheck(message)) {
      if (this.permissionMessage) {
        return Promise.resolve(message.author.mention + ' ' + this.permissionMessage)
      }
      return Promise.resolve()
    }

    if (this.cooldown !== 0 && !this.cooldownCheck(message.author.id)) {
      if (this.cooldownMessage) {
        return Promise.resolve(message.author.mention + ' ' + this.cooldownMessage)
      }
      return Promise.resolve()
    }

    return this.execute(handler, message, args)
  }

  execute (handler, message, args) {
    return Promise.reject(new Error('Abstract Command class cannot be used'))
  }

  /**
   * Returns the id of this command
   * Each command id must be unique in its command group
   * @instance
   * @return {String} The commands ID
   */
  getId () {
    return this.id
  }

  /**
   * Returns the aliases of this command
   * @return {String[]} list of command aliases
   */
  getAliases () {
    return this.aliases
  }

  /**
   * Returns the parameters for this command
   * @return {String[]} list of parameters in order
   */
  getParameters () {
    return this.parameters
  }

  /**
   * Returns the categories this command falls under
   * @return {String[]} command categories
   */
  getCategories () {
    return this.categories
  }

  /**
   * Returns the description for this command
   * @return {String} command description
   */
  getDescription () {
    return this.description
  }

  /**
   * Returns the parent command group for this command
   * @return {Command} command parent
   */
  getParent () {
    return this.parent
  }

  getCooldown () {
    return this.cooldown
  }

  setCooldown (sec) {
    this.finalizeCheck()
    this.cooldown = sec
  }

  setGuildOnly (guildOnly) {
    this.finalizeCheck()

    this.guildOnly = guildOnly
  }

  finalizeCheck () {
    if (this.finalized) {
      throw new CommandStateError('Cannot change finalized command')
    }
  }

  /**
   * Sets the parent command group for this command
   * Should not be called unless you need to add to a command group after
   * it has been finalized
   * @param {CommandGroup} parent Parent command group
   */
  setParent (parent) {
    this.finalizeCheck()

    this.parent = parent
  }

  /**
   * Retruns a string representing the path taken to get to this command
   * @example
   * 'commandGroup1 commandGroup2 targetCommand'
   * @return {String} command path
   */
  getParentPath () {
    let l = []
    let p = this

    while (p.parent !== null) {
      p = p.parent
      if (p.id !== null && p.id !== undefined) {
        l.unshift(p.id)
      }
    }

    return l
  }


  getCommandPath () {
    let l = this.getParentPath()
    l.push(this.id)
    return l
  }

  /**
   * Returns the top most command group.
   * Should be the event handler group
   * @return {Command} root parent commandgroup
   */
  getRootParent () {
    return this.parent === null ? this : this.parent.getRootParent()
  }

  // getHelp(args){ return this.description; }

  /**
   * Finalize the command so no other changes can be made
   */
  finalize () {
    if (this.finalized) {
      throw new CommandStateError('Command already finalized')
    }

    this.finalized = true

    let args = this.getParameters()
    if (args.length > 0) {
      args = R.compose(R.join(' '), R.map(M.inline))(args)
    }
    this.helpString = `${M.inline(this.getId())} ${args} `
  }
}

/**
 * Creates a new CategoryCommand extending {[Command]}
 * @class CategoryCommand
 * @classdesc Command for each category
 */
class CategoryCommand extends Command {
  constructor () {
    super({
      id: 'categories',
      parameters: ['(category)'],
      categories: ['util', 'help'],
      description: 'List commands by category'
    })
  }

  execute (handler, evt, args) {
    let parent = this.getParent()
    return Promise.resolve(M.code(parent.getCommands()))
  }
}

class HelpCommand extends Command {
  constructor () {
    super({
      id: 'help',
      parameters: ['(command)'],
      categories: ['util', 'help'],
      description: 'Get a list of commands'
    })
  }

  execute (handler, message, args) {
    let pageNum = 1
    if (!isNaN(args[0])) {
      pageNum = parseInt(args.shift())
    }

    let commands = this.getParent().getCommands()

    let listings = []
    let line

    console.log(this.getParentPath())

    R.forEach(command => {
      line = handler.chatPrefix + R.join(' ', command.getCommandPath())
      if (command.description !== '') {
        line = line + ' - ' + command.description
      }
      listings.push(line)
    }, R.values(commands))

    return Promise.resolve(R.join('\n', listings))
  }
}

class TextCommand extends Command {
  constructor (args) {
    super(args)
    this.response = args.text
  }

  execute (handler, evt, args) {
    return Promise.resolve(this.response)
  }
}

class SimpleCommand extends Command {
  constructor (args) {
    super(args)
    this._run = args.run
  }

  execute (handler, evt, args) {
    return this._run(handler, evt, args)
  }
}

module.exports = {
  Command,
  HelpCommand,
  CategoryCommand,
  TextCommand,
  SimpleCommand,
  CommandError,
  CommandStateError,
  UnknownCommandError,
  UsageError,
  HelpTextError
}
