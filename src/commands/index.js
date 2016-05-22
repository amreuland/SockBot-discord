'use strict'

const glob = require('glob')
const R = require('ramda')

const globOptions = {
  realpath: true,
  nodir: true
}

const commandFiles = R.uniq(R.unnest([
  glob.sync(`${__dirname}/*(!(index.js))`, globOptions),
  glob.sync(`${__dirname}/*/index.js`, globOptions),
  glob.sync(`${__dirname}/*/*/index.js`, globOptions),
  glob.sync(`${__dirname}/*(!(help))/*.js`, globOptions)
]))
// Merge all the commands objecs together and export.

// console.log(commandFiles)
const commands = R.filter(a => a !== undefined, R.flatten(R.map(jsPath => {
  var f = require(jsPath)
  if (f.commands) return f.commands
}, commandFiles)))

// console.log(commands);

module.exports = commands
