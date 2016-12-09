'use strict'

const CommandGroup = require('lib/command/CommandGroup')
const { TextCommand, HelpCommand } = require('lib/command/Command')
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
  ['fuckyou', 'https://i.imgur.com/Fgr8kcM.gifv'],
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
  ['wtf', 'thefuck', 'whatthefuck', 'https://i.imgur.com/IH4fZyx.png'],
  ['stealthoptional', 'nostealth', 'whatisstealth', 'stealth?', 'https://i.imgur.com/9PboFvi.gif'],
  ['ohgodno', 'https://i.imgur.com/MAQreoX.gif'],
  ['feelsbad', 'https://i.imgur.com/XcWtwb6.png'],
  ['fuckyoosa', 'meesa', 'https://i.imgur.com/4T0IwsW.gifv'],
  ['hi', 'https://i.imgur.com/imgiP30.png'],
  ['popcorn', 'go', 'https://i.imgur.com/keSKyPf.gifv'],
  ['iseeit', 'https://i.imgur.com/8othL4H.gifv'],
  ['whatdidyoudo', 'whatdyoudo', 'https://i.imgur.com/yLPfeVJ.gifv'],
  ['inthemiddle', 'https://i.imgur.com/CFdMonB.gifv'],
  ['spam', 'https://i.imgur.com/fVGSSvR.png'],
  ['excellent', 'https://i.imgur.com/iigLQ0T.gif'],
  ['yes', 'canada', 'https://i.imgur.com/NH0zEjj.gif'],
  ['thisisfine', 'https://i.imgur.com/HeUNm7E.gifv'],
  ['myjam', 'https://i.imgur.com/1AxGtP8.gifv'],
  ['datboi', 'http://i1.kym-cdn.com/entries/icons/original/000/020/401/1461813522505.jpg'],
  ['ilied', 'https://i.imgur.com/gy7bgm3.gif'],
  ['diabolicallaughter', 'dlaugh', 'https://i.imgur.com/yR0fJDD.gifv'],
  ['runbitch', 'runb', 'run', 'https://i.imgur.com/gYACGP6.gifv'],
  ['stealth', 'https://i.imgur.com/BbZHFS6.png'],
  ['killurge', 'https://i.imgur.com/m1LWo6O.jpg'],
  ['confusion', 'https://i.imgur.com/AEVtLHS.jpg'],
  ['notime', 'https://i.imgur.com/xH5YIqF.png'],
  ['crouch', 'https://i.imgur.com/sgS5hTa.gifv'],
  ['yesbounce', 'https://i.imgur.com/BiF6FjQ.gifv'],
  ['nope', 'https://i.imgur.com/7EuLTsX.gif'],
  ['food', 'foodtime', 'hungry', 'https://i.imgur.com/b8gs8I7.gif'],
  ['driving', 'https://i.imgur.com/5oZsI6f.gifv'],
  ['lunchfuckit', 'https://i.redditmedia.com/tFe6u-XkSpUbDe9-QNKn5PlN9AK8G61KKMuRnrpUqnY.jpg?w=550&s=ff78fec5fb3faf1b3af4bf57cf0b04ec'],
  ['game?', 'https://i.imgur.com/iIvGAua.jpg'],
  ['mistake', 'https://i.imgur.com/2MU0SNK.jpg'],
  ['talkingshit', 'shittalking', 'talkinshit', 'https://i.imgur.com/El90BZb.jpg'],
  ['dowhatiwant', 'https://i.imgur.com/eGtpt2E.gif']
]

let id
let aliases
let text

let commander = new CommandGroup({
  id: 'memes',
  aliases: ['meme'],
  categories: ['fun', 'memes'],
  parameters: ['<meme>'],
  description: 'Funny and/or stupid images',
  cooldown: 5
})

commander.registerCommand(new HelpCommand())

R.forEach(meme => {
  aliases = R.init(meme)
  id = R.head(aliases)
  text = R.last(meme)
  commander.registerCommand(new TextCommand({
    id: id,
    aliases: aliases,
    text: text,
    categories: ['memes']
  }))
}, memes)

let allCommands = R.map(R.compose(x => '`' + x + '`', R.join('`, `'), R.init), memes)

commander.registerCommand(new TextCommand({
  id: 'list',
  aliases: ['listm', 'listmemes'],
  text: R.join('\n', allCommands),
  categories: ['memes']
}))

module.exports.commands = [
  commander
]
