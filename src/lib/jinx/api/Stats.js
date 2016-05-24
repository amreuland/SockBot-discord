'use strict'

const { genUrl } = require('../util')

const restPoint = {
  fullName: 'stats-v1.3',
  name: 'stats',
  version: '1.3'
}

const TTL_STATS_RANKED = 900
const TTL_STATS_SUMMARY = 900

const getStatsRanked = (region, summonerId) => {
  var requestParams = {
    caller: 'getStatsRanked',
    region: region
    url: `${genUrl(region, restPoint)}/by-summoner/${summonerId}/ranked`
  }

  var cacheParams = {
    rest: restPoint,
    region: region,
    ttl: TTL_STATS_RANKED,
    saveIfNull: true,
    objectType: 'stats',
    params: [summonerId, 'ranked'],
  }

  // return
}

const getStatsSummary = (region, summonerId) => {
  var requestParams = {
    caller: 'getStatsRanked',
    region: region
    url: `${genUrl(region, restPoint)}/by-summoner/${summonerId}/summary`
  }

  var cacheParams = {
    rest: restPoint,
    region: region,
    ttl: TTL_STATS_SUMMARY,
    saveIfNull: true,
    objectType: 'stats',
    params: [summonerId, 'summary'],
  }

  // return
}

module.exports = {
  restPoint,
  methods: {
    getStatsRanked,
    getStatsSummary
  }
}
