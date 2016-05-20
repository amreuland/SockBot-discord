'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const { Markdown:M, SplitString:splitter } = require('lib/StringUtils')
const { UnknownCommandError, UsageError } = require('lib/command/Errors')

const { Command } = require('lib/command/Command')

const MAX_HELP_PER_PAGE = 8

const getId = obj => M.inline(obj._id)
const getParameters = obj => (obj._parameters.length >= 1 ? ' ' + M.inline(R.join(' ', obj._parameters)) : '')
const getDescription = obj => (obj._description.length >= 1 ? `\n\t${obj._description}` : '')

// const makeUsageString = obj => M.

const getPartitions = R.juxt([getId, getParameters, getDescription])
const createString = R.compose(R.join(''), getPartitions)

const selectFields = R.project(['_id', '_parameters', '_description', '_helpText'])
const getData = R.compose(selectFields, R.values)

const sortById = R.sortBy(R.prop('_id'));

const getHelpObj = R.map(createString)

class CommandGroup extends Command {
  constructor(opts){
    opts.parameters = opts.parameters || ['<sub command>', '[sub args]'];
    opts.description = opts.description || 'A command group';
    
    super(opts);
    this._commands = {};
    this._cmdAliasMap = {};
    this._helpList = [];
 
  }

  run(handler, evt, args){

    var alias = args.shift();
    if(!alias) return;
    
    alias = R.toLower(alias);
    
    var cmd = this._cmdAliasMap[alias];
    if(!cmd) return Promise.reject(new UnknownCommandError(alias));
    
    var command = this._commands[cmd];
    var ret = command.run(handler, evt, args);

    if(ret instanceof Promise){
      return ret.catch(UnknownCommandError, e => {
        e.addParent(alias);
        throw e;
      })
      .catch(UsageError, e => {
        e.addParent(alias);
        e.setParams(command._parameters);
        throw e;
      })

    }else{
      return ret;
    }
  }

  registerCommand(cmd) {
    if(this._finalized) throw new Error('Attempted to add command to finalized CommandGroup');

    if(!R.is(Command, cmd)) throw new TypeError('argument is not a command!');

    var id = cmd._id;

    if(R.contains(id, this._commands)) throw new Error(`Command with id '${id}' already exists.`)

    cmd.setParent(this);
    this._commands[id] = cmd;

    R.forEach(alias => {
      if(R.contains(alias, this._cmdAliasMap)) {
        throw new Error(`Alias '${alias}'already exists (${this._cmdAliasMap[alias]}).`)
      }
      this._cmdAliasMap[alias] = id;
    }, cmd._aliases);

  }

  unregisterCommand(id){
    var id = R.toLower(id);
    var aliases = this._commands[id].aliases;
    R.forEach(alias => delete this._cmdAliasMap[alias], aliases);
    
    delete this._commands[id];
  }

  finalize(){
    super.finalize();
    for(let cmd of R.values(this._commands)) cmd.finalize();
  }

}

module.exports = CommandGroup;