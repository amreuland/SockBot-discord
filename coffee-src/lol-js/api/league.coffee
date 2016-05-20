ld = require 'lodash'

api = exports.api = {
  fullname: "league-v2.5",
  name: "league",
  version: "v2.5"
}

MAX_SUMMONER_IDS_PER_REQUEST = 10
MAX_TEAM_IDS_PER_REQUEST = 10

exports.methods = {

  getLeaguesBySummonerId: (region, summonerIds) ->
    @_riotMultiGet(
      region,
      {
        caller: "getLeaguesBySummonerId",
        baseUrl: "#{@_makeUrl region, api}/by-summoner",
        ids: summonerIds,
        getCacheParamsFn: entryBySummonerIdCacheParams('leagues-summoner'),
        maxObjs: MAX_SUMMONER_IDS_PER_REQUEST
      }
    )

  getLeagueEntriesBySummonerId: (region, summonerIds) ->
    @_riotMultiGet(
      region,
      {
        caller: "getLeagueEntriesBySummonerId",
        baseUrl: "#{@_makeUrl region, api}/by-summoner",
        urlSuffix: "/entry",
        ids: summonerIds,
        getCacheParamsFn: entryBySummonerIdCacheParams('leagues-entry-summoner'),
        maxObjs: MAX_SUMMONER_IDS_PER_REQUEST
      }
    )

  getLeaguesByTeamId: (region, teamIds) ->
    @_riotMultiGet(
      region,
      {
        caller: "getLeaguesByTeamId",
        baseUrl: "#{@_makeUrl region, api}/by-team",
        ids: teamIds,
        getCacheParamsFn: entryByTeamIdCacheParams('leagues-team'),
        maxObjs: MAX_TEAM_IDS_PER_REQUEST
      }
    )

  getLeagueEntriesByTeamId: (region, teamIds) ->
    @_riotMultiGet(
      region,
      {
        caller: "getLeagueEntriesByTeamId",
        baseUrl: "#{@_makeUrl region, api}/by-team",
        urlSuffix: "/entry",
        ids: teamIds,
        getCacheParamsFn: entryByTeamIdCacheParams('leagues-entry-team'),
        maxObjs: MAX_TEAM_IDS_PER_REQUEST
      }
    )

}

entryBySummonerIdCacheParams = (objectType) -> (client, region, summonerId) -> {
    key: "#{api.fullname}-#{objectType}-#{region}-#{summonerId}"
    api, region,
    ttl: 1800,
    objectType: objectType
    params: {summonerId}
  }

entryByTeamIdCacheParams = (objectType) -> (client, region, teamId) -> {
    key: "#{api.fullname}-#{objectType}-#{region}-#{teamId}"
    api, region,
    ttl: 1800,
    objectType: objectType
    params: {teamId}
  }