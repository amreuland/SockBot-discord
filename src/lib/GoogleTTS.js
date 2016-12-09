'use strict'

const Promise = require('bluebird')
const R = require('ramda')
const md5 = require('MD5')
const fs = require('fs-extra')
const path = require('path')
const request = require('request')
const slugify = require('underscore.string/slugify')
const gTTSGen = require('google-tts-api')

// var MemoryStream = require('memorystream');

const ensureDirAsync = Promise.promisify(fs.ensureDir)
const existsAsync = Promise.promisify(fs.exists)

// class Thingy {
//   constructor(url){
//     this.memStream = new MemoryStream();
//     this.url = url;
//   }

//   go(){
//     request.get({
//       url: this.url,
//       headers: {
//         'user-agent': 'Mozilla/5.0'
//       }
//     })
//     .on('error', console.error)
//     .on('data', data => {
//       this.memStream.write(data);
//     })
//     .on('end', () => {
//       this.memStream.end()
//     })
//   }
// }

class GoogleTTS {
  constructor (options) {
    if (R.is(String, options)) options = {cache: options}
    this.name = 'google'
    this.cache = options.cache || path.join(__dirname, 'tts', 'cache')
    this.speed = options.speed || 1
    this.format = options.format || 'mp3'
    this.options = {
      lang: options.lang || 'en'
    }

    // Promise.map(R.map(x => ('0' + x.toString(16)).slice(-2), R.range(0, 256)), num => {
    //   return ensureDirAsync(path.join(this.cache, num))
    // }).catch(console.error);
  }

  getFile (obj) {
    const options = R.merge(this.options, (R.is(String, obj) ? {str: obj} : obj))

    const qs = {
      l: options.lang,
      s: options.str,
      q: this.speed,
      r: options.str.length,
      x: this.format
    }

    // Get the file signature
    const signature = md5(R.join('-', R.values(qs)))
    const cacheDir = path.join(this.cache, this.name, options.lang, signature.substr(0, 2))
    const cacheFile = `${slugify(options.str).substring(0, 50)}_${signature}.${this.format}`
    const cachePath = path.join(cacheDir, cacheFile)

    return ensureDirAsync(cacheDir)
    .then(res => existsAsync(cachePath))
    .catch(e => {
      if (e.message === 'true') {
        return true
      }
      
      throw e
    })
    // .return(false)
    .then(res => {
      if (res === true) {
        console.log(`Play file '${cacheFile}' from cache`)
        return cachePath
      } else {
        return gTTSGen(options.str, options.lang, this.speed)
        .then(url => {
          // return new Thingy(url)
          return new Promise((resolve, reject) => {
            var audioFile = fs.createWriteStream(cachePath)
            console.log(`Request sound file '${url}'`)
            request.get({
              url: url,
              headers: {
                'user-agent': 'Mozilla/5.0'
              }
            })
            .on('error', reject)
            .on('data', data => {
              audioFile.write(data)
            })
            .on('end', () => {
              console.log(`Saving sound file '${cachePath}'`)
              audioFile.end()
              resolve(cachePath)
            })
          })
        })
      }
    })
  }
}

module.exports = GoogleTTS
