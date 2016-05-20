'use strict';


const Promise = require('bluebird')
const R = require('ramda')
const { Markdown:M } = require('lib/StringUtils')

class CommandError extends Error {
  constructor(args){
    args = args || ''
    if(R.is(String, args)) args = { message: args }
    super(args.message);
    this.cmdChain = (args.chain ? [args.chain] : []);
  }
  addParent(alias){ this.cmdChain.unshift(alias); }
  getChain(){return this.cmdChain; }
}

class CommandStateError extends CommandError {
  constructor(args){
    super(args)
  }
}

class UnknownCommandError extends CommandError {
  constructor(args){
    super('Unknown Command')
    this.cmdChain = [args]
  }
}

class UsageError extends CommandError {
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

class HelpTextError extends CommandError {
  constructor(){
    super('HelpTextError');
    // this.cmdChain = []
    // this.parameters = 
    // this.description = 
  }
  addParent(alias){ this.cmdChain.unshift(alias); }
}

module.exports = { 
  CommandError,
  UnknownCommandError,
  UsageError,
  HelpTextError
}