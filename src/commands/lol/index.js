'use strict'

// const Promise = require('bluebird');
// const conf = require('config');
// const R = require('ramda');
// const CommandGroup = require('lib/command/CommandGroup');
// const CommandGroup = require('lib/command/CommandGroup');

// const Promise = require('bluebird')
// const conf = require('config')
// const R = require('ramda')

const { SimpleCommand } = require('lib/command/Command')
const CommandGroup = require('lib/command/CommandGroup')

// const { Markdown: M } = require('lib/StringUtils')

const { matchDetails } = require('./riot')
// import

// function lolUsage()

var commander = new CommandGroup({
  id: 'league',
  aliases: ['lol'],
  categories: ['games', 'fun'],
  parameters: ['<action>', '[action args]'],
  description: 'Commands that help with League of Legends'
})

commander.registerCommand(new SimpleCommand({
  id: 'match',
  run: matchDetails,
  parameters: ['<region>', '<summoner>'],
  description: 'Get the current match for a summoner'
}))

module.exports.commands = [
  commander
]
