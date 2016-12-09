'use strict'

import util from 'util'
import R from 'ramda'
import wrap from './wrap'
import lowLevel from './lowLevel'
import configure from './configure'



export default function CaptainsLog (overrides) {
  let options = configure(overrides)
  let logger = lowLevel()

  if (options.custom) {
    logger = options.custom

    if (!R.is(Object, logger) || !R.is(Function, logger.log)) {
      throw new Error(
        'Unsupported logger override provided as `custom`!\n' +
        '(has no `.log()` or `.debug()` methid.)\n' +
        'Passed: \n' + util.inspect(logger, {depth: null})
      )
    }
  }

  let nullLog = function () {}

  logger.debug = logger.debug || nullLog
  logger.info = logger.info || nullLog
}
