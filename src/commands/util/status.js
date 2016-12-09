'use strict'

const Promise = require('bluebird')
const conf = require('config')
const R = require('ramda')

const { SimpleCommand } = require('lib/command/Command')
const CommandGroup = require('lib/command/CommandGroup')
const { Markdown: M } = require('lib/StringUtils')

let statusGroup = new CommandGroup({
  id: 'status',
  categories: ['util'],
  parameters: ['<get|set>', '[status]'],
  description: 'Get or Set the bots Status'
})

statusGroup.registerCommand(new SimpleCommand({
  id: 'get',
  run: (handler, evt, args) => {
    return Promise.resolve(M.inline(handler.getClient().User.gameName))
  },
  description: 'Get the current status of the bot'
}))

statusGroup.registerCommand(new SimpleCommand({
  id: 'set',
  run: (handler, evt, args) => {
    let s = R.join(' ', args)
    handler.getClient().User.setStatus('online', {name: s})
    return
  },
  parameters: ['<status>'],
  description: 'Set the current status of the bot',
  deleteCommand: true,
  reqs: {
    userIds: R.keys(conf.admins)
  }
}))

module.exports.commands = [
  statusGroup
]

