'use strict'

const BaseModel = require('./BaseModel')

const BaseSummoner = {
  id: null,
  name: null,
  profileIconId: null,
  revisionDate: null,
  summonerLevel: null
}

const BaseMastery = {
  id: null,
  rank: null
}

const BaseMasteryPage = {
  current: false,
  id: null,
  masteries: [MasteryModel],
  name: null
}

const BaseMasteryPages = {
  pages: [MasteryPageModel],
  summonerId: null
}

const BaseRuneSlot = {
  runeId: null,
  runeSlotId: null
}

const BaseRunePage = {
  current: false,
  id: null,
  name: null,
  slots: [RuneSlotModel]
}

const BaseRunePages = {
  pages: [RunePageModel],
  summonerId: null
}

class SummonerModel extends BaseModel {
  constructor (def) {
    super(BaseSummoner, def)
  }
}

class MasteryPagesModel extends BaseModel {
  constructor (def) {
    super(BaseMasteryPages, def)
  }
}

class MasteryPageModel extends BaseModel {
  constructor (def) {
    super(BaseMasteryPage, def)
  }
}

class MasteryModel extends BaseModel {
  constructor (def) {
    super(BaseMastery, def)
  }
}

class RunePagesModel extends BaseModel {
  constructor (def) {
    super(BaseRunePages, def)
  }
}

class RunePageModel extends BaseModel {
  constructor (def) {
    super(BaseRunePage, def)
  }
}

class RuneSlotModel extends BaseModel {
  constructor (def) {
    super(BaseRuneSlot, def)
  }
}

module.exports = {
  SummonerModel,
  MasteryPagesModel,
  MasteryPageModel,
  MasteryModel,
  RunePagesModel,
  RunePageModel,
  RuneSlotModel
}
