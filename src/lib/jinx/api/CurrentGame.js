'use strict'

const restPoint = {
  fullName: 'current-game-v1.0',
  name: 'current-game',
  version: '1.0'
}

const genUrl = (region, platform, summonerId) => {
  return `https://${region}.api.pvp.net/observer-mode/rest/consumer/getSpectatorGameInfo/${platform}/${summonerId}`
}

const getCurrentGame = (region, summonerId) => {
  var platform = region.toUpperCase()
  if (platform !== 'KR' && platform !== 'RU') {
    platform = platform + '1'
  }
  if (platform === 'OCE1') {
    platform = 'OC1'
  }
  if (platform === 'EUNE1') {
    platform = 'EUN1'
  }

  var requestParams = {
    caller: 'getCurrentGame',
    region: region,
    url: genUrl(region, platform, summonerId)
  }

  var cacheParams = {
    rest: restPoint,
    region: region,
    ttl: 10,
    saveIfNull: false,
    objectType: 'currentGame',
    params: [summonerId]
  }
}

module.exports = {
  restPoint,
  methods: {
    getCurrentGame
  }
}
