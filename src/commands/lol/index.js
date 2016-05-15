'use strict';

const Promise = require('bluebird');
const conf = require('config');
const R = require('ramda');
const riot = require('./riot');
const CommandHandler = require('lib/command/CommandHandler');
const M = require('lib/Util').Markdown;

// function lolUsage()

var commander = new CommandHandler();

commander.registerCommand({
  id: 'match',
  run: riot.matchDetails,
  params: ['region', 'summoner']
})


module.exports.commands = {
  league: {run: (handler, evt, args) => commander.run(handler, evt, args), aliases: ['lol']}
}
