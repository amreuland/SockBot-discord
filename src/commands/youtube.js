'use strict';

const YoutubeNode = require('youtube-node');
// const promisify = require("promisify-node");
const conf = require('config');
const Promise = require('bluebird');
const M = require('lib/Util').Markdown;

const yt_usage = `Usage: ${M.inline(conf.chat_prefix + 'youtube')} ${M.inline('search parameters')}`;

const youtube = new YoutubeNode();
youtube.setKey(conf.youtube.api_key);
youtube.addParam('type', 'video,playlist');

// const ytSearch = promisify(youtube.search);

function search(handler, obj, args){
  return new Promise((resolve, reject) => {
    youtube.search(args.join(' '), 1, (err, res) => {
      if(err) reject(err);
      resolve(res);
    })
  })
  .then(res => {
    if (!res || !res.items || res.items.length < 1) return 'Youtube returned an error';
    const id_obj = res.items[0].id;
    if (id_obj.playlistId) return `https://www.youtube.com/playlist?list=${id_obj.playlistId}`;
    return `http://www.youtube.com/watch?v=${id_obj.videoId}`;
  })
}

module.exports.commands = {
  youtube: {run: search, aliases: ['yt']}
};

module.exports.help = {
  youtube: {parameters: ['search terms']}
};