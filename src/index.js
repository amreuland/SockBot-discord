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

var timeoutTime = 10;

var client = new Discord();
var GTTS = new GoogleTTS(conf.tts.cache);

var admins = {
  '144600822737534976': 'noriah',
  '148647353686032384': 'Dakota'
}

var channelMap = {};

var keepRunning = true;

var announceQueue = [];

client.connect({
  token: conf.token
})

client.Dispatcher.on("GATEWAY_READY", e => {
  console.log("Connected as: " + client.User.username);

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

chatHandler.registerCommand('test', ['t'], function(handler, obj, author, content, args){
  obj.channel.sendMessage(args.slice(1).join(' '));
});


chatHandler.registerCommand('vleave', [], function(handler, obj, author, content, args){
  handler.bot.Channels
  .filter(channel => channel.type == "voice" && channel.joined)
  .forEach(channel => channel.leave());
});

chatHandler.registerCommand('vsay', ['s', 'say', 'vs'], function(handler, obj, author, content, args){

  var vchannel = handler.bot.Channels
  .find(channel => channel.type == "voice" && channel.joined)
  if(vchannel){
    announceQueue.push({
      action: args.slice(1).join(' '),
      guild: obj.channel.guild.id,
      channel: obj.channel.id,
      info: vchannel.getVoiceConnectionInfo()
    })
  }
});


chatHandler.registerCommand('vjoin', [], function(handler, obj, author, content, args){
  var vchannel =
    obj.channel.guild.voiceChannels
    .find(channel => channel.name.indexOf(args.slice(1).join(' ')) >= 0);
  if (vchannel) vchannel.join().then(info => {
    var channel = info.voiceConnection.channel;
    channelMap[channel.id] = [];
    channel.members.forEach(member => {
      channelMap[channel.id][member.id] = {connected: true, time: Math.floor(Date.now() / 1000)}
    });
  });
});


chatHandler.registerCommand('vstop', [], function(handler, obj, author, content, args){
  // var info = client.VoiceConnections.getForGuild(guild);
  // if (info) {
  //   var encoderStream = info.voiceConnection.getEncoderStream();
  //   encoderStream.unpipeAll();
  // }
  announceQueue = [];
});


chatHandler.registerCommand('quit', [], function(handler, obj, author, content, args){
  handler.bot.Channels
  .filter(channel => channel.type == "voice" && channel.joined)
  .forEach(channel => channel.leave());
  obj.channel.sendMessage("Good Bye");
  keepRunning = false;
  handler.bot.disconnect();
});



chatHandler.registerCommand('youtube', ['yt'], function(handler, obj, author, content, args){
  const youtube = new YoutubeNode();
  youtube.setKey(conf.youtube.api_key);
  youtube.addParam('type', 'video,playlist');
  youtube.search(args.slice(1).join(' '), 1, (err, res1) => {
    Promise.resolve(res1).then(result => {
      if (!result || !result.items || result.items.length < 1) return `${T('youtube_error', lang)}: ${suffix}`;
      const id_obj = result.items[0].id;
      if (id_obj.playlistId) return `https://www.youtube.com/playlist?list=${id_obj.playlistId}`;
      return `http://www.youtube.com/watch?v=${id_obj.videoId}`;
    })
    .then(res => {
      obj.channel.sendMessage(res);
    })
    .catch(err => console.error(err));
  });
});


// client.Dispatcher.on(Discord.Events.MESSAGE_CREATE, chatHandler.)


// client.Dispatcher.on("MESSAGE_CREATE", e => {
//   const user = e.message.author;
  
//   if(!admins[user.id]){
//     return;
//   }

//   const channel = e.message.channel;
//   const guild = e.message.channel.guild;

//   if(e.message.content.indexOf('::') == 0){
//     const content = e.message.content.substring(2);
//   }else{
//     return;
//   }

//   if (content == "ping") {
//     channel.sendMessage("pong");
//   }

//   if (content == "vleave") {
//     client.Channels
//     .filter(channel => channel.type == "voice" && channel.joined)
//     .forEach(channel => channel.leave());
//   }

//   if (content.indexOf("vjoin ") == 0) {
//     const targetChannel = content.replace("vjoin ", "");

//     var vchannel =
//       guild.voiceChannels
//       .find(channel => channel.name.indexOf(targetChannel) >= 0);
//     if (vchannel) vchannel.join().then(info => {
//       var channel = info.voiceConnection.channel;
//       channelMap[channel.id] = [];
//       channel.members.forEach(member => {
//         channelMap[channel.id][member.id] = {connected: true, time: Math.floor(Date.now() / 1000)}
//       });
//     });
//   }

//   if (content.indexOf("stop") == 0) {
//     var info = client.VoiceConnections.getForGuild(guild);
//     if (info) {
//       var encoderStream = info.voiceConnection.getEncoderStream();
//       encoderStream.unpipeAll();
//     }
//   }

//   if (content.indexOf("quit") == 0) {
//     client.Channels
//     .filter(channel => channel.type == "voice" && channel.joined)
//     .forEach(channel => channel.leave());
//     channel.sendMessage("Good Bye");
//     keepRunning = false;
//     client.disconnect();
//   }
// });

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

      if(Math.floor(Date.now() / 1000) - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = true;
      channelMap[vchannel.id][e.user.id].time = Math.floor(Date.now() / 1000);
      var user = e.user.memberOf(e.guildId);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: name + ' has joined the channel',
        guild: e.guildId,
        channel: e.channelId,
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
      if(Math.floor(Date.now() / 1000) - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = false;
      channelMap[vchannel.id][e.user.id].time = Math.floor(Date.now() / 1000);
      var user = e.user.memberOf(e.guildId);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: name + ' has left the channel',
        guild: e.guildId,
        channel: e.channelId,
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
      if(Math.floor(Date.now() / 1000) - channelMap[vchannel.id][e.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][e.user.id].connected = false;
      channelMap[vchannel.id][e.user.id].time = Math.floor(Date.now() / 1000);
      var user = e.user.memberOf(e.guild);
      var name;
      if(user){
        name = user.name;
      }else{
        name = e.user.username;
      }
      announceQueue.push({
        action: name + ' has gone offline',
        guild: e.guild.guildId,
        channel: e.channelId,
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
    .then(function(aPath){

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
    .catch(function(err){
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
