'usr strict'

const Promise = require('bluebird')
const R = require('ramda')

// class Markdown {
//   constructor(){
    
//   }
// }

module.exports = {
  percentage: (num, denom, places=2) => {
    exp = Math.pow(10, places)
    return Math.round((num/denom) * exp) / exp
  }
}