'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const { Markdown: M } = require('lib/StringUtils')

class CommandError extends Error {
  constructor (args) {
    args = args || ''
    if (R.is(String, args)) args = { message: args }
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
  constructor ({
    id: optsId,
    aliases: optsAliases = [],
    parameters: optsParameters = [],
    categories: optsCategories = [],
    description: optsDescription = ''
  }) {
    this._id = optsId
    this._aliases = optsAliases
    this._parameters = optsParameters
    this._categories = optsCategories
    this._description = optsDescription

    this._parent = null
    this._parentList = []
    this._finalized = false
    this._id = R.toLower(this._id)

    if (R.is(String, this._aliases)) {
      this._aliases = [this._aliases]
    }

    this._aliases = R.map(R.toLower, this._aliases)
    
    if (!R.contains(this._id, this._aliases)) {
      this._aliases.push(this._id)
    }

    if (R.is(String, this._parameters)) {
      this._parameters = [this._parameters]
    }
  }

  run (handler, evt, args) {
    return Promise.reject(new Error('Abstract Command class cannot be used'))
  }

  getId () { return this._id }
  getAliases () { return this._aliases }
  getParameters () { return this._parameters }
  getCategories () { return this._categories }
  getDescription () { return this._description }

  getParent () { return this._parent }

  setParent (parent) {
    if (this._finalized) throw new CommandStateError('Cannot set parent on finalized command')
    this._parent = parent
  }

  getParentPath () {
    let l = [this.getId()]
    let p = this

    while (p.getParent() !== null) {
      p = p.getParent()
      if (p.getId() !== 'null') l.unshift(p.getId())
    }

    return R.join(' ', l)
  }

  getRootParent () { return this._parent === null ? this : this._parent.getRootParent() }

  // getHelp(args){ return this._description; }

  finalize () {
    if (this._finalized) throw new CommandStateError('Command already finalized')
    this._finalized = true
  }
}

class CategoryCommand extends Command {
  constructor () {
    super({
      id: 'categories',
      parameters: ['(category)'],
      categories: ['util', 'help'],
      description: 'List commands by category'
    })
  }

  run (handler, evt, args) {
    let parent = this.getParent()
    return Promise.resolve(M.code(parent.getCommands()))
  }
}

class HelpCommand extends Command {
  constructor () {
    super({
      id: 'help',
      parameters: ['(category)'],
      categories: ['util', 'help'],
      description: 'List commands by category'
    })
  }

  run (handler, evt, args) {
    if (!isNaN(args[0])) {
      let pageNum = parseInt(args[0])
      return Promise.resolve(pageNum)
    }

    return Promise.resolve('a')
  }
}

class TextCommand extends Command {
  constructor (args) {
    super(args)
    this._return = args.text
  }

  run (handler, evt, args) {
    return Promise.resolve(this._return)
  }
}

class SimpleCommand extends Command {
  constructor (args) {
    super(args)
    this._run = args.run
  }

  run (handler, evt, args) {
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
