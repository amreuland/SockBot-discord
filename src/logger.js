'use strict'

import R from 'ramda'
import chalk from 'chalk'
import moment from 'moment'

const LogLevel = {
  emergency: 10,
  critical: 9,
  error: 8,
  warning: 7,
  notice: 6,
  info: 2,
  debug: 0
}

export class Logger {
  constructor () {

  }

  fatal (message, name = 'FATAL') {

  }

  critical (message, name = 'CRITICAL') {

  }

  error (message, name = 'ERROR') {

  }

  warning (message, name = 'WARNING') {

  }

  notice (message, name = 'NOTICE') {

  }

  info (message, name = 'INFO') {

  }

  debug (message, name = 'DEBUG') {

  }

  send (message, level, prefix, color) {
    let now = Date.now()
  }
}
