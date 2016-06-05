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

const getStatsType = type => {
  type = type.toLowerCase()
  var capped = type[0].toUpperCase() + type.substr(1)
  return (region, summonerId) => {
    var requestParams = {
      rest: restPoint,
      caller: `getStats${capped}`,
      region: region,
      url: `${genUrl(region, restPoint)}/by-summoner/${summonerId}/${type}`,
      cache: {
        ttl: TTL_TIMES[type],
        key: `stats-${summonerId}-${type}`,
        saveIfNull: true
      }
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
