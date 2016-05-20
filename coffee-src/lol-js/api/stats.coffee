
api = exports.api = {
    fullname: "stats-v1.3",
    name: "stats",
    version: "v1.3"
}

exports.methods = {

    getRankedStats: (region, summonerId) ->

        requestParams = {
            caller: "getRankedStats",
            region: region,
            url: "#{@_makeUrl region, api}/by-summoner/#{summonerId}/ranked"
        }

        cacheParams = {
            key: "#{api.fullname}-statsRanked-#{region}-#{summonerId}"
            region, api,
            ttl: 900,
            objectType: 'stats'
            params: {summonerId}
        }

        @_riotRequestWithCache requestParams, cacheParams

    getStatsSummary: (region, summonerId) ->

        requestParams = {
            caller: "getRankedStats",
            region: region,
            url: "#{@_makeUrl region, api}/by-summoner/#{summonerId}/summary"
        }

        cacheParams = {
            key: "#{api.fullname}-statsSummary-#{region}-#{summonerId}"
            region, api,
            ttl: 900,
            objectType: 'stats'
            params: {summonerId}
        }

        @_riotRequestWithCache requestParams, cacheParams
}
