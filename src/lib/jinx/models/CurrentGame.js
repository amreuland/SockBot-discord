'use strict'

const BaseModel = require('./BaseModel')

const BaseCurrentGame = {
  bannedChampions: [BannedChampion],
  gameId: null,
  gameLength: null,
  gameMode: null,
  gameQueueConfigId: null,
  gameStartTime: null,
  gameType: null,
  mapId: null,
  observers: null,
  participants: [CurrentGameParticipant],
  platformId: null
}

const BaseBannedChampion = {
  championId: null,
  pickTurn: null,
  teamId: null
}

const BaseCurrentGameParticipant = {
  bot: false,
  championId: null,
  masteries: [MasteryModel]
}

class CurrentGameModel extends BaseModel {
  constructor (def) {
    super(BaseCurrentGame, def)
  }
}

module.exports = {
  CurrentGameModel
}
