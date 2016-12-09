'use strict'

const Promise = require('bluebird')
const YoutubeNode = require('youtube-node')
const conf = require('config')

const { Command, UsageError } = require('lib/command/Command')

// const ytSearch = promisify(youtube.search);

class YouTubeSearchCommand extends Command {
  constructor () {
    super({
      id: 'youtube',
      aliases: ['yt'],
      categories: ['fun', 'util', 'video'],
      parameters: ['<search terms>'],
      description: 'Search for videos or playlists on YouTube',
      guildOnly: true,
      cooldown: 10,
      cooldownMessage: 'Slow your roll'
    })

    this.youtube = new YoutubeNode()
    this.youtube.setKey(conf.youtube.api_key)
    this.youtube.addParam('type', 'video,playlist')
  }

  execute (handler, message, args) {
    if (args.length <= 0) {
      return Promise.reject(new UsageError(['No search terms provided']))
    }

    return new Promise((resolve, reject) => {
      this.youtube.search(args.join(' '), 1, (err, res) => {
        if (err) {
          return reject(err)
        }

        return resolve(res)
      })
    })
    .then(res => {
      if (!res || !res.items || res.items.length < 1) {
        return 'Youtube returned an error'
      }

      const idObj = res.items[0].id
      if (idObj.playlistId) {
        return `https://www.youtube.com/playlist?list=${idObj.playlistId}`
      }

      return `http://www.youtube.com/watch?v=${idObj.videoId}`
    })
  }
}

module.exports.commands = [
  new YouTubeSearchCommand()
]
