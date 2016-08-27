'use strict'

const { TextCommand } = require('lib/command/Command')
const R = require('ramda')

var memes = [
  ['likeabus', 'https://i.imgur.com/5biy9iw.gif'],
  ['nerdshit', 'https://i.imgur.com/12btDtk.jpg'],
  ['multifuckyou', 'multifuck', 'https://i.imgur.com/0TQaRsq.gif'],
  ['thefuckisthis', 'thefuckisthat', 'tfit', 'https://i.imgur.com/zixI2AV.png'],
  ['bitcheshammocks', 'hammock', 'hammocks', 'bitcheslovehammocks', 'https://i.imgur.com/SlBMGqj.jpg'],
  ['thisasshole', 'https://i.imgur.com/WBLkX.jpg'],
  ['knifegun', 'https://i.imgur.com/rof5dg1.jpg'],
  ['tugboat', 'https://i.imgur.com/zN7zaGs.jpg'],
  ['anotherone', 'https://i.imgur.com/IYhb201.jpg'],
  ['unexpected', 'https://i.imgur.com/ZqwwF50.jpg'],
  ['barbaric', 'https://i.imgur.com/aOOKSA5.jpg'],
  ['breadcrumbs', 'https://i.imgur.com/zaCeu08.gif'],
  ['fuckyou', 'https://i.imgur.com/xqlVQOC.jpg'],
  ['allofthem', 'https://i.imgur.com/8nAo9qS.jpg'],
  ['casual', 'https://i.imgur.com/LUJJ8aK.jpg'],
  ['allyourshit', 'https://i.imgur.com/AF4BFcw.jpg'],
  ['morepower', 'https://i.imgur.com/KndZxnY.jpg'],
  ['tibbers', 'tibburrs', 'tiburs', 'tibburs', 'tibers', 'https://i.imgur.com/Aqc6gGs.gif'],
  ['toast', 'https://i.imgur.com/3MYkU.jpg'],
  ['sweetbabyjesus', 'babyjesus', 'https://i.imgur.com/vKfdFNF.gif'],
  ['challengeaccepted', 'caccept', 'acceptchallenge', 'https://i.imgur.com/Kzv6didh.jpg'],
  ['soclose', 'https://i.imgur.com/puUob76.jpg'],
  ['aaaaaaaaaawwwwwwyyyyyyeeeeeeeeaaaaaaaaa', 'awyea', 'https://i.imgur.com/M4clxJK.png'],
  ['challengeconsidered', 'cconsidered', 'considerchallenge', 'https://i.imgur.com/lxRXrmu.png'],
  ['challengedenied', 'cdenied', 'denychallenge', 'https://i.imgur.com/OELM6SB.jpg'],
  ['fuckyea', 'fuckyeah', 'fyeah', 'https://i.imgur.com/mTUTJpU.png'],
  ['upvote', 'https://i.imgur.com/UxUMIfY.gif'],
  ['delight', 'https://i.imgur.com/WS4a0QD.jpg'],
  ['wtf', 'thefuck', 'whatthefuck', 'https://i.imgur.com/IH4fZyx.png']
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

let allCommands = R.map(R.compose(x => '`' + x + '`', R.join('`, `'), R.init), memes)

ex.push(new TextCommand({
  id: 'listmemes',
  aliases: ['listm'],
  text: R.join('\n', allCommands),
  categories: ['memes']
}))

module.exports.commands = ex

// imgur client id bb2ee1187b59f81
// imgur client secret e78f79abe8089424859ea83d2df8f3ef88bb443f
