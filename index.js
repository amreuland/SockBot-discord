'use strict'

const path = require('path')

const srcDir = path.normalize(path.join(__dirname, 'src'))

require('include-path')(srcDir)

require('./src/')
