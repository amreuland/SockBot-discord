'use strict'

const api = {
  fullName: 'current-game-v1.0',
  name: 'current-game',
  version: 'v1.0'
}

const getCurrentGame = (region, summonerId) => {
  var obRegion = region.toUpperCase()
  if (obRegion !== 'KR' && obRegion !== 'RU') {
    obRegion = obRegion + '1'
  }

  if (obRegion === 'OCE1') {
    obRegion = 'OC1'
  }

}

module.exports = {
  getCurrentGame
}
