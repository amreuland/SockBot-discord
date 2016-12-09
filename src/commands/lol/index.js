'use strict'

const CommandGroup = require('lib/command/CommandGroup')

const { HelpCommand } = require('lib/command/Command')

const { LoLMatchLookupCommand } = require('./riot')

let lookupCommand = new LoLMatchLookupCommand('match')
lookupCommand.setGuildOnly(true)
// lookupCommand.setTimeout()

var commander = new CommandGroup({
  id: 'league',
  aliases: ['lol'],
  categories: ['games', 'fun'],
  parameters: ['<action>', '[action args]'],
  description: 'Commands that help with League of Legends'
})

commander.registerCommand(new HelpCommand())
commander.registerCommand(lookupCommand)

module.exports.commands = [
  commander
]
