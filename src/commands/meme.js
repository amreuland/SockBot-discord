'use strict'

const { TextCommand } = require('lib/command/Command')
const R = require('ramda')

var memes = [
  ['likeabus', 'https://i.imgur.com/5biy9iw.gif'],
  ['nerdshit', 'https://i.imgur.com/12btDtk.jpg'],
  ['multifuckyou', 'multifuck', 'https://i.imgur.com/0TQaRsq.gif'],
  ['thefuckisthis', 'thefuckisthat', 'tfit', 'https://i.imgur.com/zixI2AV.png'],
  ['bitcheshammocks', 'bitcheslovehammocks', 'https://i.imgur.com/SlBMGqj.jpg']
]

var ex = []
var id
var aliases
var text

R.forEach(meme => {
  aliases = R.init(meme)
  id = R.head(aliases)
  text = R.last(meme)
  ex.push(new TextCommand({
    id: id,
    aliases: aliases,
    text: text,
    categories: ['memes']
  }))
}, memes)

module.exports.commands = ex
