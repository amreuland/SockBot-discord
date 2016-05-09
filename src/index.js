var Discord = require('discordie');
var GoogleTTS = require('./GoogleTTS');
var path = require('path');
var async = require('async');
var sleep = require('sleep');
var lame = require('lame');
var fs = require('fs');

var YoutubeNode = require('youtube-node');

var ChatHandler = require('./lib/ChatHandler');

var conf = require('../config');

var timeoutTime = 10000;

var client = new Discord();
var GTTS = new GoogleTTS(conf.tts.cache);

var admins = conf.admins;

var channelMap = {};

var keepRunning = true;

var announceQueue = [];

client.connect({
  token: conf.token
})

client.Dispatcher.on("GATEWAY_READY", e => {
  console.log(`Connected as: ${client.User.username}`);

  var vchannel =
    client.Channels
    .find(channel => channel.type == "voice" && channel.name.indexOf('General') >= 0);
  if (vchannel) vchannel.join().then(info => {
    var channel = info.voiceConnection.channel;
    channelMap[channel.id] = {};
    channel.members.forEach(member => {
      channelMap[channel.id][member.id] = {connected: true, time: 0};
    });
  });

})

var chatHandler = new ChatHandler(client);

chatHandler.register();

chatHandler.registerCommand('ping', [],
  (handler, obj, args) => {
    handler.reply(obj, 'pong');
  }
);

chatHandler.registerCommand('test', ['t'],
  (handler, obj, args) => {
    handler.reply(obj, args.join(' '));
  }
);

chatHandler.registerCommand('vleave', [],
  (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return handler.reply(obj, 'Nuh.');
    g.voiceChannels
    .filter(channel => channel.joined)
    .forEach(channel => channel.leave());
  }
);

chatHandler.registerCommand('vsay', ['s', 'say', 'vs', ']'],
  (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return handler.reply(obj, 'Nuh.');
    
    var vchannel = g.voiceChannels.find(channel => channel.joined)

    if(vchannel){
      announceQueue.push({
        action: args.join(' '),
        guild: g,
        // channel: handler.getChannel(obj).id;
        info: vchannel.getVoiceConnectionInfo()
      })
    }
  }
);

chatHandler.registerCommand('vjoin', [],
  (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return handler.reply(obj, 'Nuh.');

    var vchannel;
    if(args.length === 0){
      var user = handler.getAuthor(obj);
      vchannel = user.getVoiceChannel(g);
      if(!vchannel) return handler.reply(obj, `${user.mention} Idiot. Where do you think you are?`);

    }else{
      var cname = args.join(' ');
      vchannel = g.voiceChannels.find(channel => channel.name.indexOf(cname) >= 0);
      if(!vchannel) return handler.reply(obj, `'${cname}' is not a valid voice channel`)
    }

    if (vchannel) vchannel.join().then(info => {
      channelMap[vchannel.id] = [];
      vchannel.members.forEach(member => {
        channelMap[vchannel.id][member.id] = {connected: true, time: Date.now()}
      });
    });
  }
);

chatHandler.registerCommand('vstop', [],
  (handler, obj, args) => {
  // var info = client.VoiceConnections.getForGuild(guild);
  // if (info) {
  //   var encoderStream = info.voiceConnection.getEncoderStream();
  //   encoderStream.unpipeAll();
  // }
    announceQueue = [];
  }
);

chatHandler.registerCommand('quit', [],
  (handler, obj, args) => {
    handler.getBot().Channels
    .filter(channel => channel.type == "voice" && channel.joined)
    .forEach(channel => channel.leave());
    handler.reply(obj, "Good Bye");
    keepRunning = false;
    handler.getBot().disconnect();
  }
);

chatHandler.registerCommand('youtube', ['yt'],
  (handler, obj, args) => {
    const youtube = new YoutubeNode();
    youtube.setKey(conf.youtube.api_key);
    youtube.addParam('type', 'video,playlist');
    youtube.search(args.join(' '), 1, (err, res1) => {
      Promise.resolve(res1).then(result => {
        if (!result || !result.items || result.items.length < 1) return "Youtube dun fucked up";
        const id_obj = result.items[0].id;
        if (id_obj.playlistId) return `https://www.youtube.com/playlist?list=${id_obj.playlistId}`;
        return `http://www.youtube.com/watch?v=${id_obj.videoId}`;
      })
      .then(res => {
        handler.reply(obj, res);
      })
      .catch(err => console.error(err));
    });
  }
);


// client.Dispatcher.on("VOICE_CONNECTED", e => {
//   // uncomment to play on join
//   //play();
// });

client.Dispatcher.on("VOICE_CHANNEL_JOIN", e => {
  if(e.user.id == client.User.id){
    console.log("Not announcing own actions.");
    return;
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == e.channelId)
  if(vchannel){
//    console.log("JOIN");
//    console.log(vchannel);
    // async.nextTick(function(){
      if(!channelMap[vchannel.id][e.user.id]){
        channelMap[vchannel.id][e.user.id] = {connected: true, time: 0};
      }

      if(Date.now() - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = true;
      channelMap[vchannel.id][e.user.id].time = Date.now();
      var user = e.user.memberOf(e.guildId);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: `${name} has joined the channel`,
        guild: e.guildId,
        // channel: e.channelId,
        info: vchannel.getVoiceConnectionInfo()
      })
      // console.log(channelMap[vchannel.id][e.user.id]);
    // })
  };
})

client.Dispatcher.on("VOICE_CHANNEL_LEAVE", e => {
  if(e.user.id == client.User.id){
    console.log("Not announcing own actions.");
    return;
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == e.channelId)
  if(vchannel){
//    console.log("LEAVE");
//    console.log(vchannel);
    // async.nextTick(function(){
      if(Date.now() - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = false;
      channelMap[vchannel.id][e.user.id].time = Date.now();
      var user = e.user.memberOf(e.guildId);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: `${name} has left the channel`,
        guild: e.guildId,
        // channel: e.channelId,
        info: vchannel.getVoiceConnectionInfo()
      })
      // console.log(channelMap[vchannel.id][e.user.id]);
    // })
  };
})

client.Dispatcher.on('PRESENCE_UPDATE', e => {
  if(e.user.status === "offline" && e.user.previousStatus === "online"){
    var vchannel = client.Channels
    .find(channel => channel.type =="voice" && channel.joined && channelMap[channel.id] && channelMap[channel.id][e.user.id])
    if(vchannel){
      if(!channelMap[vchannel.id][e.user.id] || !channelMap[vchannel.id][e.user.id].connected){
        return;
      }
      if(Date.now() - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = false;
      channelMap[vchannel.id][e.user.id].time = Date.now();
      var user = e.user.memberOf(e.guild);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: `${name} has gone offline`,
        guild: e.guild.guildId,
        // channel: e.channelId,
        info: vchannel.getVoiceConnectionInfo()
      })
      // console.log(channelMap[vchannel.id][e.user.id]);
    }
  }
});

function runTickNow() {
  if(announceQueue.length){
    var eve = announceQueue.shift();
    if (!client.VoiceConnections.length) {
      return console.log("Voice not connected");
    }
    var info = eve.info;
//    console.log("QUEUE");
//    console.log(eve); 
    GTTS.getFile({
      str: eve.action,
      speed: 1
    })
    .then(aPath => {

      var encoder = info.voiceConnection.createExternalEncoder({
        type: "ffmpeg",
        source: aPath,
        format: "pcm",
        outputArgs: ["-af", 'volume=volume=0.25'],
//        debug: true
      });
      if (!encoder) return console.log("Voice connection is no longer valid");

      encoder.once("end", () => {
//        console.log("ENDED");
        setTimeout(runTickNow, 125);
      });

      var encoderStream = encoder.play();
//      encoderStream.resetTimestamp();
//      encoderStream.removeAllListeners("timestamp");
//      encoderStream.on("timestamp", time => console.log("Time " + time));

    })
    .catch(err => {
      console.error(err);
    });
  }else{
    if(keepRunning){
      setTimeout(runTickNow, 10);
    }
  }
}

//client.Dispatcher.onAny((type, e) => {
  //var ignore = [
  //  "READY",
  //  "GATEWAY_READY",
  //  "ANY_GATEWAY_READY",
  //  "GATEWAY_DISPATCH",
  //  "PRESENCE_UPDATE",
  //  "TYPING_START",
  //];
  //if (ignore.find(t => (t == type || t == e.type))) {
  //  return console.log("<" + type + ">");
  //}

  //console.log("\nevent " + type);
  //return console.log("args " + JSON.stringify(e));
//});

setTimeout(runTickNow, 100);
