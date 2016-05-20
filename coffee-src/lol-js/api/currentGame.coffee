
api = exports.api = {
    fullname: "current-game-v1.0",
    name: "current-game",
    version: "v1.0"
}

makeUrl = (region, obRegion, summonerId) -> "https://#{region}.api.pvp.net/observer-mode/rest/consumer/getSpectatorGameInfo/#{obRegion}/#{summonerId}"

exports.methods = {

    getCurrentGame: (region, summonerId) ->
        
        obRegion = region.toUpperCase()
        
        if obRegion != 'KR' && obRegion != 'RU'
            obRegion = obRegion + '1'
        
        if obRegion == 'OCE1'
            obRegion = 'OC1'

        if obRegion == 'EUNE1'
            obRegion = 'EUN1'

        requestParams = {
            caller: "getCurrentGame",
            region: region,
            url: "#{makeUrl region, obRegion, summonerId}"
        }

        # toCacheParam = (arr) -> arr?.sort().join(',')

        cacheParams = {
            key: "#{api.fullname}-current-game-#{region}-#{summonerId}"
            region, api,
            ttl: 10
            objectType: 'currentGame'
            params: {summonerId}
        }

        @_riotRequestWithCache requestParams, cacheParams
}