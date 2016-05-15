'use strict';

const Promise = require('bluebird');
const R = require('ramda');
const M = require('lib/Util').Markdown;
const Command = require('./Command');

// var helpString = (alias, parameters, desc, help) => `]${alias}`
// var cmdString = (alias, parameters) => {
//   return `\`${alias}\` \`${}\``
// }

class CommandHandler {
  constructor(){
    this.commands = {};
    this.help = {};
    this.aliases = {};
    this.parameters = {};
    this.descriptions = {};
  }

  _help(alias){

  }

  run(handler, evt, args){
    if(R.is(String, args)) args = args.trim().split(/\s+/);

    var alias = args.shift();
    if(!alias) return Promise.resolve('Nope');
    alias = R.toLower(alias);
    const cmd = this.aliases[alias];
    if(!cmd) return Promise.reject(new Command.UnknownCommandError({
      message: 'Unknown Command!',
      chain: alias
    }));

    var command = this.commands[cmd];
    // console.log(alias, command);

    var ret = command.run(handler, evt, args);

    if(ret instanceof Promise){
      return ret.catch(Command.UnknownCommandError, e => {
        e.addParent(alias);
        throw e;
      })
      .catch(Command.UsageError, e => {
        e.addParent(alias);
        e.setParams(this.parameters[cmd]);
        throw e;
      })

    }else{
      return ret;
    }
  }

  registerCommand(cmd) {
    var id = cmd.id || 'foo';
    
    var aliases = cmd.aliases || cmd.alias || id;
    if(R.is(String, aliases)) aliases = [aliases];

    var runnable = cmd.runnable || cmd.run || null;
    if(!runnable || runnable === null) throw new Error(`Command '${id}' has no runnable method`);
    
    var parameters = cmd.parameters || cmd.params || [];
    var description = cmd.description || cmd.desc || '';
    var helpText = cmd.help || '';

    id = R.toLower(id);

    if(R.contains(id, this.commands)){
      throw new Error(`Command with id '${id}' already exists.`);
    }

    aliases = R.map(R.toLower, aliases);
    if(!R.contains(id, aliases)){
      aliases.push(id);
    }

    this.commands[id] = {
      aliases: aliases,
      run: runnable,
      // permission: defaultPerm
    }

    R.forEach(alias => {
      alias = R.toLower(alias);
      if(R.contains(alias, this.aliases)) {
        throw new Error(`Alias '${alias}'already exists (${this.aliases[alias]}).`)
      }
      this.aliases[alias] = id;
    }, aliases);

    this.parameters[id] = parameters;
    this.descriptions[id] = description;
    this.help[id] = helpText;
  }

  unregisterCommand(id){
    id = R.toLower(id);
    var aliases = this.commands[id].aliases;
    R.forEach(alias => delete this.aliases[alias], aliases);
    
    delete this.help[id];
    delete this.parameters[id];
    delete this.commands[id];
    delete this.descriptions[id];
  }

}

module.exports = CommandHandler;