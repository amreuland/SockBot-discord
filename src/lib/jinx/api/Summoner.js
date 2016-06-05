'use strict'

const R = require('ramda')

const { genUrl } = require('../util')

const restPoint = {
  fullName: 'summoner-v1.4',
  name: 'summoner',
  version: '1.4'
}

const TTL_TIMES = {
  'summonerName': 259200,
  'summonerId': 259200
}

const MAX_SUMMONER_BY_NAME_REQUEST = 40
const MAX_SUMMONER_BY_ID_REQUEST = 40

const standardizeIt = R.compose(R.replace(/ /g, ''), R.toLower)

const getSummonersByName = (region, summonerNames) => {
  var stdSummonerNames = R.map(standardizeIt, summonerNames)
  var stdReqNameMap = R.zipObj(stdSummonerNames, summonerNames)

  var requestParams = {
    rest: restPoint,
    caller: 'getSummonersByName',
    region: region,
    data: stdSummonerNames,
    url: `${genUrl(region, restPoint)}/by-name`,
    suffix: '',
    maxObjs: MAX_SUMMONER_BY_NAME_REQUEST,
    cache: getSummonerByDataCacheParams(region, 'summonerName')
  }

  // return
}

const getSummonersById = (region, summonerIds) => {
  var requestParams = {
    rest: restPoint,
    caller: 'getSummonersById',
    region: region,
    data: summonerIds,
    url: genUrl(region, restPoint),
    suffix: '',
    maxObjs: MAX_SUMMONER_BY_ID_REQUEST,
    cacheFn: getSummonerByDataCacheParams(region, 'summonerId')
  }

  // return
}

const getSummonerNames = (region, summonerIds) => {
  return getSummonersById(region, summonerIds).map(R.prop('name'))
}

const getSummonerByDataCacheParams = R.curry((region, type, summonerNameId) => {
  return {
    ttl: TTL_TIMES[type],
    key: `${type}-${summonerNameId}`,
    saveIfNull: true
  }
})

module.exports = {
  restPoint,
  methods: {
    getSummonersByName,
    getSummonersById,
    getSummonerNames
  }
}
