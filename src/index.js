var Discord = require('discordie');
var GoogleTTS = require('./GoogleTTS');
var path = require('path');
var async = require('async');
var sleep = require('sleep');
var lame = require('lame');
var fs = require('fs');

var cache_dir = path.normalize('/home/wolf/Projects/Discord/wolfbot/data/tts/cache');

var client = new Discord();
var GTTS = new GoogleTTS(cache_dir);

var admins = {
  '144600822737534976': 'noriah',
  '148647353686032384': 'Dakota'
}

var announceQueue = [];

client.connect({
  token: 'MTcxOTg4NDA0NDQyMTAzODA4.Cg73HA.88VdMGgGOstYscc89wASN-Dw9H8'
})

client.Dispatcher.on("GATEWAY_READY", e => {
  console.log("Connected as: " + client.User.username);
})

client.Dispatcher.on("MESSAGE_CREATE", e => {
  const user = e.message.author;
  
  if(!admins[user.id]){
    return;
  }

  const channel = e.message.channel;
  const guild = e.message.channel.guild;

  if(e.message.content.indexOf('::') == 0){
    const content = e.message.content.substring(2);
  }else{
    return;
  }

  if (content == "ping") {
    channel.sendMessage("pong");
  }

  if (content == "vleave") {
    client.Channels
    .filter(channel => channel.type == "voice" && channel.joined)
    .forEach(channel => channel.leave());
  }

  if (content.indexOf("vjoin ") == 0) {
    const targetChannel = content.replace("vjoin ", "");

    var vchannel =
      guild.voiceChannels
      .find(channel => channel.name.indexOf(targetChannel) >= 0);
    if (vchannel) vchannel.join();
  }

  if (content.indexOf("stop") == 0) {
    var info = client.VoiceConnections.getForGuild(guild);
    if (info) {
      var encoderStream = info.voiceConnection.getEncoderStream();
      encoderStream.unpipeAll();
    }
  }

  if (content.indexOf("quit") == 0) {
    client.Channels
    .filter(channel => channel.type == "voice" && channel.joined)
    .forEach(channel => channel.leave());
    channel.sendMessage("Good Bye");
    client.disconnect();
  }
});

client.Dispatcher.on("VOICE_CONNECTED", e => {
  // uncomment to play on join
  //play();
});

client.Dispatcher.on("VOICE_CHANNEL_JOIN", e => {
  if(e.user.id == client.User.id){
    console.log("Not announcing own actions.");
    return;
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == e.channelId)
  if(vchannel){
    console.log("JOIN");
    console.log(vchannel);
    // async.nextTick(function(){
      announceQueue.push({
        user: e.user.username,
        action: 'joined',
        guild: e.guildId,
        channel: e.channelId,
        info: vchannel.getVoiceConnectionInfo()
      })
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
    console.log("LEAVE");
    console.log(vchannel);
    // async.nextTick(function(){
      announceQueue.push({
        user: e.user.username,
        action: 'left',
        guild: e.guildId,
        channel: e.channelId,
        info: vchannel.getVoiceConnectionInfo()
      })
    // })
  };
})

function runTickNow() {
  if(announceQueue.length){
    var eve = announceQueue.shift();
    if (!client.VoiceConnections.length) {
      return console.log("Voice not connected");
    }
    var info = eve.info;
    console.log("QUEUE");
    console.log(eve); 
    GTTS.getFile(eve.user + ' has ' + eve.action + ' the channel')
    .then(function(aPath){

      var encoder = info.voiceConnection.createExternalEncoder({
        type: "ffmpeg",
        source: aPath,
        format: "pcm",
        // outputArgs: ["-af"],
        debug: true
      });
      if (!encoder) return console.log("Voice connection is no longer valid");

      encoder.once("end", () => {
        console.log("ENDED");
        setTimeout(runTickNow, 500);
      });

      var encoderStream = encoder.play();
      encoderStream.resetTimestamp();
      encoderStream.removeAllListeners("timestamp");
      encoderStream.on("timestamp", time => console.log("Time " + time));

    })
    .catch(function(err){
      console.error(err);
    });
  }else{
    setImmediate(runTickNow);
  }
}

client.Dispatcher.onAny((type, e) => {
  var ignore = [
    "READY",
    "GATEWAY_READY",
    "ANY_GATEWAY_READY",
    "GATEWAY_DISPATCH",
    "PRESENCE_UPDATE",
    "TYPING_START",
  ];
  if (ignore.find(t => (t == type || t == e.type))) {
    return console.log("<" + type + ">");
  }

  console.log("\nevent " + type);
  return console.log("args " + JSON.stringify(e));
});

setTimeout(runTickNow, 100);
