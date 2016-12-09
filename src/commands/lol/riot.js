'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const conf = require('config')
const moment = require('moment')

const Ashe = require('ashe')
const redis = require('redis')
const { Markdown: M, toTitleCase } = require('lib/StringUtils')
const { percentage } = require('lib/MathUtils')
const { Command, UsageError } = require('lib/command/Command')

class InvalidRegionError extends Error {}
class NotInGameError extends Error {}
class UserNotFound extends Error {}
// class ChampionInfoError extends Error {}

class LoLMatchLookupCommand extends Command {
  constructor (id) {
    super({
      id: id,
      parameters: ['<region>', '<summoner>'],
      description: 'Get the current match for a summoner'
    })

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

    this.lolClient = new Ashe(opts)

    let s1 = `${M.bold('Summoner')} - ${M.underline('Rank')}`
    let s2 = `${M.bold('Champion')} (Avg KDA)`
    let s3 = `${M.underline('Win Rate%')} over ${M.underline('# of Ranked Games')}`

    this.titleMessage = `${s1},   ${s2}   ${s3}`
  }

  validateRegion (region) {
    return new Promise((resolve, reject) => {
      if (R.is(Object, region)) {
        region = region.region
      }

      if (R.contains(R.toLower(region), R.keys(Ashe.REGIONS))) {
        return resolve(R.toLower(region))
      }

      return reject(new InvalidRegionError(region))
    })
  }

  getMatchData (region, name, summonerId) {
    return this.lolClient.getCurrentGame(region, summonerId)
    .tap(data => {
      if (!data || data === null) {
        return Promise.reject(new NotInGameError(name))
      }
    })
  }

  getPlayerRanks (region, summoners) {
    let summonerData = R.zipObj(R.pluck('summonerId')(summoners),
      R.map(summoner => {
        return {
          rank: 'Unranked',
          teamId: summoner.teamId,
          championId: summoner.championId,
          summonerName: summoner.summonerName,
          summonerId: summoner.summonerId
        }
      }, summoners))

    return this.lolClient.getLeagueEntriesBySummonerId(region, R.keys(summonerData))
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
  }

  getChampStats (region, summoner) {
    return this.lolClient.getStatsRanked(region, summoner.summonerId)
    .then(d => (d === null ? [] : d['champions']))
    .then(champs => R.zipObj(R.pluck('id', champs), R.pluck('stats', champs)))
    .then(stats => {
      let cId = R.toString(summoner.championId)
      return this.lolClient.getChampionById(region, cId, {dataById: true})
      .then(champ => {
        summoner.stats = {
          name: (champ ? champ.name : 'UNKNOWN'),
          games: 0,
          winRate: 0,
          kda: {
            k: 0,
            d: 0,
            a: 0
          }
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
  }

  getSummonerIdName (summoner, region) {
    return this.lolClient.getSummonersByName(region, [summoner])
    .tap(out => {
      if (out[summoner] === null) {
        return Promise.reject(new UserNotFound(summoner))
      }
    })
  }

  formatStats (summoners) {
    return R.map(summoner => {
      let stats = summoner.stats
      let s = `\t${M.bold(summoner.summonerName)} - ${M.underline(summoner.rank)}`
      let c = `${M.bold(stats.name)} (${stats.kda.k}/${stats.kda.d}/${stats.kda.a})`
      let w = `${M.underline(`${stats.winRate}%`)} over ${M.underline(`${stats.games}`)}`
      return `${s},   ${c}   ${w}`
    }, summoners)
  }

  buildSideString (team, data) {
    return R.compose(
      R.join('\n'),
      this.formatStats,
      R.filter(summoner => summoner.teamId === team)
    )(data)
  }

  execute (handler, message, args) {
    message.channel.sendTyping()

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

    return this.validateRegion(region)
    .then(data => this.getSummonerIdName(summoner, data))
    .then(data => R.compose(R.prop('id'), R.nth(0), R.values)(data))
    .tap(data => { summonerId = data })
    .then(data => this.getMatchData(region, summoner, data))
    .tap(data => { matchData = data })
    .then(R.prop('participants'))
    .then(data => this.getPlayerRanks(region, data))
    .tap(data => this.lolClient.getChampions(region, {dataById: true}))
    .then(R.values)
    .map(data => this.getChampStats(region, data), {concurrency: Infinity})
    .then(data => {
      let gameMode = Ashe.GAMEMODES[matchData.gameMode] || 'UNKNOWN'
      let gameMap = Ashe.MAPS[matchData.mapId]
      gameMap = (!gameMap ? 'UNKNOWN' : gameMap.name)

      let blueSideText = `${M.underline('Blue Side')}:\n${this.buildSideString(100, data)}`
      let redSideText = `${M.underline('Red Side')}:\n${this.buildSideString(200, data)}`
      let gameText = `Playing ${M.bold(gameMode)} on ${M.bold(gameMap)}`
      let timeText = `Started at ${M.underline(moment(matchData.gameStartTime).format('HH:mm__ [on] __MM/DD/YY'))}`
      let lengthText = `Current Length: ${moment.unix(matchData.gameLength).utc().format('HH:mm:ss')}`
      let headerText = `${gameText}\n\n${matchData.gameStartTime > 0 ? timeText : 'Has Not Started Yet'}  |  ${lengthText}`
      let summonerTeam = R.find(R.propEq('summonerId', summonerId), data).teamId === 100 ? 'Blue' : 'Red'
      let titleText = `Found Summoner: ${M.bold(summoner)} on the ${M.underline(summonerTeam)} side`

      return R.join('\n\n', [titleText, headerText, this.titleMessage, blueSideText, redSideText])
    })
    .catch(UserNotFound, e => Promise.resolve(`Sorry. I can't find ${M.bold(e.message)} in the ${M.bold(region)} region`))
    .catch(InvalidRegionError, e => Promise.resolve(`Error: ${M.bold(e.message)} is not a valid region.`))
    .catch(NotInGameError, e => Promise.resolve(`${M.bold(e.message)} is not currently in a match.`))
  }
}

module.exports = { LoLMatchLookupCommand }
