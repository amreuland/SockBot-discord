'use strict';
/* globals _: true, request: true */
var fs = require('fs-extra'),
  path = require('path'),
  gTTSGen = require('google-tts-api'),
  _ = require('lodash'),
  request = require('request'),
  // Logger = require('g33k-logger'),
  slugify = require("underscore.string/slugify"),
  md5 = require('MD5');

var GoogleTTS = function(options) {
  var self = this;

  // Expose engine name
  self.name = 'google';

  options = _.extend({}, _.pick(options, 'lang'), _.isString(options) ? {
    cache: options
  } : options);

  // Set defaults
  self.opts = _.extend({
    lang: 'en',
    cache: __dirname + '/cache',
    format: 'mp3',
    speed: 1
  }, options);

  // try {
  //   fs.statSync(self.opts.cache).isDirectory();
  // }
  // catch(e){
  //   if(e.code == 'ENOENT'){
  //     console.log('Creating cache directory \'' + self.opts.cache + '\'.')
  //     fs.mkdirSync(self.opts.cache, 0o755);
  //   }else{
  //     throw e;
  //   }
  // }

  // Extends core with logger
  // _.extend(self, Logger.builder('[tts-' + self.name + ']', self.opts.loglevel));

};

/**
 * Request API
 */
GoogleTTS.prototype.getFile = function(obj) {
  var self = this;

  // Obj can bypass all default keys
  var opts = _.extend({}, _.pick(self.opts, 'lang'), _.isString(obj) ? {
    str: obj
  } : obj);

  // Build query strings
  var qs = {
    l: opts.lang,
    s: opts.str,
    q: opts.speed,
    r: opts.str.length,
    x: opts.format
  };

  // Get the file signature
  var signature = md5(_.values(_.omit(qs, 'key')).join('-'));
  var cacheDir = path.join(self.opts.cache, self.name, opts.lang, opts.speed.toString(), signature.substr(0,2));
  var cacheFile = `${slugify(opts.str)}_${signature}.${self.opts.format}`;
  var cachePath = path.join(cacheDir, cacheFile);



  return new Promise(function(resolve, reject){
    fs.ensureDir(cacheDir, function(err){
      if(err)
        reject(err);
      else
        resolve(true);
    })
  })
  .then(function(res){

    var isF;
    try {
      isF = fs.statSync(cachePath).isFile();
    }
    catch(e){
      if(e.code == 'ENOENT'){
        return false;
      }else{
        throw e;
      }
    }

    if(isF){
      console.log(`Play file '${cacheFile}' from cache`);
      return true;
    }else{
      throw e;
    }
    // if (fs.existsSync(cachePath)) {
    //   console.log('Play file "'   opts.src + '" from cache');
    //   resolve(true);
    // }else{
    //   resolve(false);
    // }
  }).then(function(res){
    if(res === true){
      return cachePath;
    }else{
      return gTTSGen(opts.str, opts.lang, opts.speed)
      .then(function(url){
        return new Promise(function(resolve, reject){
          var audio_file = fs.createWriteStream(cachePath);
          console.log(`Request sound file '${url}'`);
          request.get({
            url: url,
            headers: {
              'user-agent': 'Mozilla/5.0'
            }
          })
          .on('error', reject)
          .on('data', function(data){
            audio_file.write(data);
          })
          .on('end', function(){
            console.log(`Saving sound file '${cachePath}'`);
            audio_file.end();
            resolve(cachePath);
          })
        })
      })
    }
  })
};

module.exports = GoogleTTS;
