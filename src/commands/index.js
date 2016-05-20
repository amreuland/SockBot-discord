
const Promise = require('bluebird');
const glob = require('glob');
const R = require('ramda');


const glob_options = {
  realpath: true,
  nodir: true
};

const command_files = R.uniq(R.unnest([
  glob.sync(`${__dirname}/*(!(index.js))`, glob_options),
  glob.sync(`${__dirname}/*/index.js`, glob_options),
  glob.sync(`${__dirname}/*/*/index.js`, glob_options),
  glob.sync(`${__dirname}/*(!(help))/*.js`, glob_options)
]));
// Merge all the commands objecs together and export.

// console.log(command_files)
const commands = R.filter(a => a !== undefined, R.flatten(R.map(js_path => {
  var f = require(js_path);
  if(f.commands) return f.commands;
}, command_files)));

// console.log(commands);

module.exports = commands;
