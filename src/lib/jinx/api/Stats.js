'use strict'

const { genUrl } = require('../util')

const restPoint = {
  fullName: 'stats-v1.3',
  name: 'stats',
  version: '1.3'
}

const TTL_TIMES = {
  ranked: 900,
  summary: 900
}

const getStatsType = (type) => {
  type = type.toLowerCase()
  var capped = type[0].toUpperCase() + type.substr(1)
  return (region, summonerId) => {
    var requestParams = {
      caller: `getStats${capped}`,
      region: region,
      url: `${genUrl(region, restPoint)}/by-summoner/${summonerId}/${type}`
    }

    var cacheParams = {
      rest: restPoint,
      region: region,
      ttl: TTL_TIMES[type],
      saveIfNull: true,
      objectType: 'stats',
      params: [summonerId, type]
    }

    // return
  }
}

module.exports = {
  restPoint,
  methods: {
    getStatsRanked: getStatsType('ranked'),
    getStatsSummary: getStatsType('summary')
  }
}
