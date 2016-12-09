'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const conf = require('config')
const moment = require('moment')

const Ashe = require('ashe')
const redis = require('redis')
const { Markdown: M, toTitleCase } = require('lib/StringUtils')
const { percentage } = require('lib/MathUtils')
const { UsageError } = require('lib/command/Command')

let opts = {
  apiKey: conf.riot.key,
  rateLimit: conf.riot.rateLimits,
  cache: null
}

if (conf.cache.enabled) {
  opts.cache = redis.createClient({
    host: conf.cache.host,
    port: conf.cache.post,
    db: conf.cache.db
  })
}

let lolClient = new Ashe(opts)

class InvalidRegionError extends Error {}
class NotInGameError extends Error {}
class UserNotFound extends Error {}
// class ChampionInfoError extends Error {}

const _validateRegion = (region) => {
  return Promise.resolve(region).then(r => {
    if (R.is(Object, r)) {
      r = r.region
    }

    if (R.contains(R.toLower(r), R.keys(Ashe.REGIONS))) {
      return R.toLower(r)
    }

    throw new InvalidRegionError(r)
  })
}

const _getMatchDataCurry = R.curry((region, name, summonerId) => {
  return lolClient.getCurrentGame(region, summonerId)
  .tap(data => {
    if (!data || data === null) {
      return Promise.reject(new NotInGameError(name))
    }
  })
})

const _getPlayerRanksCurry = R.curry((region, summoners) => {
  let summonerData = R.zipObj(R.pluck('summonerId')(summoners), R.map(summoner => {
    return {
      rank: 'Unranked',
      teamId: summoner.teamId,
      championId: summoner.championId,
      summonerName: summoner.summonerName,
      summonerId: summoner.summonerId
    }
  }, summoners))

  return lolClient.getLeagueEntriesBySummonerId(region, R.keys(summonerData))
  // .then(R.values)
  // .map(data => data ? data[0] : {})
  .then(R.map(data => {
    return data ? data[0] : {}
  }))
  .then(R.filter(rankData => {
    return rankData.queue !== 'RANKED_TEAM_5x5' && rankData.queue !== 'RANKED_TEAM_3x3'
  }))
  .then(rankData => {
    let summIds = R.keys(rankData)
    R.forEach(sID => {
      let sData = rankData[sID]

      if (!sData.entries) {
        return
      }

      summonerData[sID].rank = `${toTitleCase(R.toLower(sData.tier))} ${sData.entries[0].division}`
    }, summIds)
  })
  .catch(console.error)
  .return(summonerData)
})

const _getChampStatsCurry = R.curry((region, summoner) => {
  return lolClient.getStatsRanked(region, summoner.summonerId)
  .then(d => (d === null ? [] : d['champions']))
  .then(champs => R.zipObj(R.pluck('id', champs), R.pluck('stats', champs)))
  .then(stats => {
    const cId = R.toString(summoner.championId)
    return lolClient.getChampionById(region, cId, {dataById: true})
    .then(champ => {
      summoner.stats = {
        name: (champ ? champ.name : 'UNKNOWN'),
        games: 0,
        winRate: 0,
        kda: { k: 0, d: 0, a: 0 }
      }
      if (stats[cId]) {
        summoner.stats.games = stats[cId].totalSessionsPlayed
        summoner.stats.winRate = percentage(stats[cId].totalSessionsWon * 100, stats[cId].totalSessionsPlayed)
        summoner.stats.kda = {
          k: percentage(stats[cId].totalChampionKills, stats[cId].totalSessionsPlayed, 1),
          d: percentage(stats[cId].totalDeathsPerSession, stats[cId].totalSessionsPlayed, 1),
          a: percentage(stats[cId].totalAssists, stats[cId].totalSessionsPlayed, 1)
        }
      }
      return summoner
    })
  })
})

const _grabIdFromObj = R.compose(R.prop('id'), R.nth(0), R.values)

const _sFormat = s => `\t${M.bold(s.summonerName)} - ${M.underline(s.rank)}`
const _cFormat = c => `${M.bold(c.name)} (${c.kda.k}/${c.kda.d}/${c.kda.a})`
const _wFormat = w => `${M.underline(`${w.winRate}%`)} over ${M.underline(`${w.games}`)}`
const _tFormat = (s, c, w) => `${s},   ${c}   ${w}`

const _titleMessage = _tFormat(
  `${M.bold('Summoner')} - ${M.underline('Rank')}`,
  `${M.bold('Champion')} (Avg KDA)`,
  `${M.underline('Win Rate%')} over ${M.underline('# of Ranked Games')}`
)

const _formatStats = summoners => R.map(s => _tFormat(_sFormat(s), _cFormat(s.stats), _wFormat(s.stats)), summoners)
const _sideStrings = (team, data) => R.compose(R.join('\n'), _formatStats, R.filter(s => s.teamId === team))(data)

const _getSummonerIdNameCurry = R.curry((summoner, region) => {
  return lolClient.getSummonersByName(region, [summoner])
  .tap(out => {
    if (out[summoner] === null) {
      throw new UserNotFound(summoner)
    }
  })
})

const matchDetails = (handler, evt, args) => {
  handler.sendTyping(evt)

  let errs = []

  let region = args.shift()
  if (!region) {
    errs.push('No region provided')
  }

  if (args.length <= 0) {
    errs.push('No summoner provided')
  }

  let summoner = R.join(' ', args)
  let summonerId
  let matchData

  if (errs.length >= 1) {
    return Promise.reject(new UsageError(errs))
  }

  return Promise.resolve(region)
  .then(_validateRegion)
  .then(_getSummonerIdNameCurry(summoner))
  .then(_grabIdFromObj)
  .tap(data => { summonerId = data })
  .then(_getMatchDataCurry(region, summoner))
  .tap(data => { matchData = data })
  .then(R.prop('participants'))
  .then(_getPlayerRanksCurry(region))
  .tap(data => lolClient.getChampions(region, {dataById: true}))
  .then(R.values)
  .map(_getChampStatsCurry(region), {concurrency: Infinity})

  .then(data => {
    let gameMode = Ashe.GAMEMODES[matchData.gameMode] || 'UNKNOWN'
    let gameMap = Ashe.MAPS[matchData.mapId]
    gameMap = (!gameMap ? 'UNKNOWN' : gameMap.name)

    const blueSideText = `${M.underline('Blue Side')}:\n${_sideStrings(100, data)}`
    const redSideText = `${M.underline('Red Side')}:\n${_sideStrings(200, data)}`
    const gameText = `Playing ${M.bold(gameMode)} on ${M.bold(gameMap)}`
    const timeText = `Started at ${M.underline(moment(matchData.gameStartTime).format('HH:mm__ [on] __MM/DD/YY'))}`
    const lengthText = `Current Length: ${moment.unix(matchData.gameLength).utc().format('HH:mm:ss')}`
    const headerText = `${gameText}\n\n${matchData.gameStartTime > 0 ? timeText : 'Has Not Started Yet'}  |  ${lengthText}`
    const summonerTeam = R.find(R.propEq('summonerId', summonerId), data).teamId === 100 ? 'Blue' : 'Red'
    const titleText = `Found Summoner: ${M.bold(summoner)} on the ${M.underline(summonerTeam)} side`

    return R.join('\n\n', [titleText, headerText, _titleMessage, blueSideText, redSideText])
  })
  .catch(UserNotFound, e => Promise.resolve(`Sorry. I can't find ${M.bold(e.message)} in the ${M.bold(region)} region`))
  .catch(InvalidRegionError, e => Promise.resolve(`Error: ${M.bold(e.message)} is not a valid region.`))
  .catch(NotInGameError, e => Promise.resolve(`${M.bold(e.message)} is not currently in a match.`))
}

module.exports = { matchDetails }
