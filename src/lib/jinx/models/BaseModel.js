'use strict'

const R = require('ramda')

class BaseModel {
  constructor (base, def) {
    for (let k in base) {
      if (Array.isArray(base[k])) {
        this[k] = R.map(d => new base[k][0](d), ((def && def.hasOwnProperty(k)) ? def[k] : []))
      } else if (Object.getPrototypeOf(base[k]) === BaseModel) {
        this[k] = new base[k]((def && def.hasOwnProperty(k)) ? def[k] : null)
      } else if (Object.getPrototypeOf(base[k]) === Object.prototype) {
        this[k] = R.map(d => new base[k]['_type'](d), ((def && def.hasOwnProperty(k)) ? def[k] : {}))
      } else {
        this[k] = ((def && def.hasOwnProperty(k)) ? def[k] : base[k])
      }
    }
    Object.freeze(this)
  }

  merge (def) {
    if (!def) {
      return this
    }

    let merged = {}
    for (let k in this) {
      merged[k] = this[k]
    }

    for (let k in def) {
      if (merged.hasOwnProperty(k)) {
        merged[k] = def[k]
      }
    }
    return new this.constructor(merged)
  }
}

module.exports = BaseModel
