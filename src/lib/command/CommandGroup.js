'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const { Markdown: M } = require('lib/StringUtils')

const { Command, UnknownCommandError, UsageError } = require('lib/command/Command')

const MAX_HELP_PER_PAGE = 8

const getId = obj => M.inline(obj.id)
const getParameters = obj => (obj.parameters.length >= 1 ? ' ' + M.inline(R.join(' ', obj.parameters)) : '')
const getDescription = obj => (obj.description.length >= 1 ? `\n\t${obj.description}` : '')

// const makeUsageString = obj => M.

const getPartitions = R.juxt([getId, getParameters, getDescription])
const createString = R.compose(R.join(''), getPartitions)

const selectFields = R.project(['id', 'parameters', 'description', 'helpText'])
const getData = R.compose(selectFields, R.values)

const sortById = R.sortBy(R.prop('id'))

const getHelpObj = R.map(createString)

class CommandGroup extends Command {

  /**
   * Creates a new CommandGroup
   *
   * @param  {Object} options command options
   * @param  {String} options.id:          the id for this
   * @param  {String[]}  options.aliases:     the aliases for this command
   * @param  {String[]}  options.parameters:  the parameters requirements
   * @param  {String[]}  options.categories:  a list of categories this command falls under
   * @param  {String} options.description: A description of this command
   * @extends {Command}
   */
  constructor (options) {
    options.parameters = options.parameters || ['<sub command>', '[sub args]']
    options.description = options.description || 'A command group'

    super(options)
    this.commands = {}
    this.cmdAliasMap = {}
    this.helpMap = {}

//    this.registerCommand()
  }

  execute (handler, evt, args) {
    let alias = args.shift()
    if (!alias) return

    alias = R.toLower(alias)

    let cmd = this.cmdAliasMap[alias]
    if (!cmd) return Promise.reject(new UnknownCommandError(alias))

    let command = this.commands[cmd]
    let ret = command.process(handler, evt, args)

    if (ret instanceof Promise) {
      return ret.catch(UnknownCommandError, e => {
        e.addParent(alias)
        throw e
      })
      .catch(UsageError, e => {
        e.addParent(alias)
        e.setParams(command.parameters)
        throw e
      })
    } else {
      return ret
    }
  }

  /**
   * Add a new command to this command group
   *
   * @param  {Command} cmd command to add
   */
  registerCommand (cmd) {
    if (this.finalized) {
      throw new Error('Attempted to add command to finalized CommandGroup')
    }

    if (!R.is(Command, cmd)) {
      throw new TypeError('argument is not a command!')
    }

    let id = cmd.id

    if (R.contains(id, this.commands)) {
      throw new Error(`Command with id '${id}' already exists.`)
    }

    cmd.setParent(this)
    this.commands[id] = cmd

    R.forEach(alias => {
      if (R.contains(alias, this.cmdAliasMap)) {
        throw new Error(`Alias '${alias}'already exists (${this.cmdAliasMap[alias]}).`)
      }
      this.cmdAliasMap[alias] = id
    }, cmd.aliases)
  }

  /**
   * Remove a command from this command group
   *
   * @param  {String} id the id of the command to remove
   */
  unregisterCommand (id) {
    id = R.toLower(id)
    let aliases = this.commands[id].aliases
    R.forEach(alias => delete this.cmdAliasMap[alias], aliases)

    delete this.commands[id]
  }

  /**
   * Finalize the command group so that no changes may be made
   * This means no new commands may be added
   *
   */
  finalize () {
    super.finalize()
    for (let cmd of R.values(this.commands)) {
      cmd.finalize()
    }
  }

  /**
   * Returns the commands this commandgroup is parent to
   *
   * @return {Command[]} A lits of commands
   */
  getCommands () {
    return this.commands
  }

}

module.exports = CommandGroup
