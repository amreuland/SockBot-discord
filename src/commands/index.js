const glob = require('glob');
const R = require('ramda');
const Promise = require('bluebird');


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
const commands = R.mergeAll(R.map(js_path => {
  var f = require(js_path);
  if(f.commands) return f.commands;
}, command_files));

module.exports = commands;
