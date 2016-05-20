var path = require('path')

const dataDir = path.normalize(__dirname + '/../data')

module.exports = {
  // This is your bot token from discord
  // You must create an application on the developers page
  // https://discordapp.com/developers/docs/intro
  token: '',
  
  data_dir: dataDir,

  tts: {
    engine: '',
    cache: dataDir + '/cache/tts'
  },

  chat_prefix: ']',

  // https://developers.google.com/youtube/v3/getting-started
  youtube: {
    api_key: ''
  },

  league: {
    api_keys: {
      championgg: '', // http://api.champion.gg/
      riot: '' // https://developer.riotgames.com/
    }
  },

  pastebin: {
    api_key: '' // http://pastebin.com/api
  },

  // https://developers.soundcloud.com/
  soundcloud: {
    client_id: '',
    client_secret: ''
  },


}
