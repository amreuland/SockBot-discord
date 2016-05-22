'usr strict'

module.exports = {
  percentage: (num, denom, places = 2) => {
    var exp = Math.pow(10, places)
    return Math.round((num / denom) * exp) / exp
  }
}
