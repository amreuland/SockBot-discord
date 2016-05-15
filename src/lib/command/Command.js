'use strict';

const Promise = require('bluebird');
const R = require('ramda');

// class Command {
//   constructor(opts){
//    this.id = opts.id || 'foo';
//    this.aliases = opts.aliases || [];
//    this.parameters = opts.parameters || [];
//    this.description = opts.description || '';
//    this.help = opts.help || '';
//   }

//   run(handler, evt, args){
//     return Promise.resolve('Hello');
//   }
// }

class SubcommandError extends Error {
  constructor(args){
    args = args || ''
    if(R.is(String, args)) args = {message: args}
    super(args.message);
    this.cmdChain = (args.chain ? [args.chain] : []);
  }
  addParent(alias){ this.cmdChain.unshift(alias); }
  getChain(){return this.cmdChain; }
}

class UnknownCommandError extends SubcommandError {
  constructor(args){
    super(args)
  }
}

class UsageError extends SubcommandError {
  constructor(args){
    super('UsageError');
    this.errs = (R.is(Array, args) ? args : [args]);
    this.parms = [];
    this.beenSet = false;
  }
  setParams(parms){
    if(this.beenSet) return;
    this.parms = parms;
    this.beenSet = true;
  }
  getParams(){ return this.parms; }
}

class HelpTextError extends SubcommandError {
  constructor(){
    super('HelpTextError');
    // this.cmdChain = []
    // this.parameters = 
    // this.description = 
  }
  addParent(alias){ this.cmdChain.unshift(alias); }
}

module.exports = {
  SubcommandError: SubcommandError,
  UnknownCommandError: UnknownCommandError,
  HelpTextError: HelpTextError,
  UsageError: UsageError
}