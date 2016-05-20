'use strict';

const Promise = require('bluebird')
const R = require('ramda')
const { Markdown:M } = require('lib/StringUtils')
const CmdErrs = require('lib/command/Errors')

class Command {
  constructor(opts){
    this._id = opts.id;
    this._aliases = opts.aliases || [];
    this._parameters = opts.parameters || [];
    this._categories = opts.categories || [];
    this._description = opts.description || '';

    this._parent = null
    this._parentList = [];
    this._finalized = false;
    this._id = R.toLower(this._id);

    if(R.is(String, this._aliases)) this._aliases = [this._aliases];
    this._aliases = R.map(R.toLower, this._aliases);
    if(!R.contains(this._id, this._aliases)) this._aliases.push(this._id);
    if(R.is(String, this._parameters)) this._parameters = [this._parameters];

  }

  run(handler, evt, args){
    return Promise.reject(new Error('Abstract Command class cannot be used'));
  }

  getId(){ return this._id }
  getAliases(){ return this._aliases }
  getParameters(){ return this._parameters }
  getCategories(){ return this._categories }
  getDescription(){ return this._description }

  getParent(){ return this._parent }

  setParent(parent){
    if(this._finalized) throw new Error('Cannot set parent on finalized command');
    this._parent = parent;
  }

  getParentPath() {
    var l = [this.getId()];
    var p = this;
    
    while (p.getParent() !== null) {
      p = p.getParent()
      if(p.getId() !== 'null') l.unshift(p.getId())
    }

    return R.join(' ', l);
  }
  getRootGroup() { return this._parent === null ? this : this._parent.getRootParent() }

  // getHelp(args){ return this._description; }

  finalize(){
    if(this._finalized) throw new Error('Command already finalized');
    this._finalized = true;
  }
}

class CategoryCommand extends Command {
  constructor(){
    super({
      id: 'categories',
      parameters: ['(category)'],
      categories: ['util', 'help'],
      description: 'List commands by category'
    })
  }

  run(handler, evt, args){
    var parent = this.getParent()
    return Promise.resolve(M.code(parent._commands));

  }
}

class HelpCommand extends Command {
  constructor(){
    super({
      id: 'help',
      parameters: ['(category)'],
      categories: ['util', 'help'],
      description: 'List commands by category'
    })
  }

  run(handler, evt, args){

  }
}

class TextCommand extends Command {
  constructor(args){
    super(args);
    this._return = args.text;
  }

  run(handler, evt, args){
    return Promise.resolve(this._return);
  }
}

class SimpleCommand extends Command {
  constructor(args){
    super(args);
    this._run = args.run;
  }

  run(handler, evt, args){
    return this._run(handler, evt, args);
  }
}


module.exports = {
  Command,
  HelpCommand,
  CategoryCommand,
  TextCommand,
  SimpleCommand
}