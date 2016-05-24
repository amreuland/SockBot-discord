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
  masteries: [Mastery],
  name: null
}

const BaseMasteryPages = {
  pages: [MasteryPage],
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
  slots: [RuneSlot]
}

const BaseRunePages = {
  pages: [RunePage],
  summonerId: null
}

class Summoner extends BaseModel {
  constructor (def) {
    super(BaseSummoner, def)
  }
}

class MasteryPages extends BaseModel {
  constructor (def) {
    super(BaseMasteryPages, def)
  }
}

class MasteryPage extends BaseModel {
  constructor (def) {
    super(BaseMasteryPage, def)
  }
}

class Mastery extends BaseModel {
  constructor (def) {
    super(BaseMastery, def)
  }
}

class RunePages extends BaseModel {
  constructor (def) {
    super(BaseRunePages, def)
  }
}

class RunePage extends BaseModel {
  constructor (def) {
    super(BaseRunePage, def)
  }
}

class RuneSlot extends BaseModel {
  constructor (def) {
    super(BaseRuneSlot, def)
  }
}

module.exports = {
  Summoner,
  MasteryPages,
  MasteryPage,
  Mastery,
  RunePages,
  RunePage,
  RuneSlot
}
