'use strict';

const path = require('path');
// var config = require('config');

const srcDir = path.normalize(__dirname + '/src')


// process.env.NODE_PATH = __dirname + '/src' ;
require('include-path')(srcDir)

require('./src/')
