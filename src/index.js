'use strict';

const Discord = require('discordie');
const path = require('path');
const async = require('async');
const sleep = require('sleep');
const lame = require('lame');
const fs = require('fs');
const Promise = require('bluebird');


const R = require('ramda');
const conf = require('config');

const GoogleTTS = require('lib/GoogleTTS');
const ChatHandler = require('lib/handlers/ChatHandler');

const commands = require('commands/');
// console.log(commands);

var timeoutTime = 10000;

var client = new Discord();
var GTTS = new GoogleTTS(conf.tts.cache);

var admins = conf.admins;

var channelMap = {};

var keepRunning = true;

var announceQueue = [];

var connected = false;

function connect() {
    client.Dispatcher.removeListener(Discord.Events.GATEWAY_READY, handleConnection);
    client.Dispatcher.removeListener(Discord.Events.DISCONNECTED, handleDisconnection);
    client.Dispatcher.once(Discord.Events.GATEWAY_READY, handleConnection);
    client.Dispatcher.once(Discord.Events.DISCONNECTED, handleDisconnection);

    console.log('Trying to connect...');
    client.connect({token: conf.token});
}

function handleConnection(evt) {
  console.log(`Connected as: ${client.User.username}`);

  var vchannel =
    client.Channels
    .find(channel => channel.type == "voice" && channel.name.indexOf('General') >= 0);

  // if (vchannel) vchannel.join();

  connected = true;
}

function handleDisconnection(evt) {
    console.log("DISCONNECTED!!!!!")
    console.log(evt);
    var time;
    if(connected) {
        console.log('The bot has disconnected');
        console.log('Trying to reconnect in 10 seconds...');
        time = 10000;
    } else {
        console.log('Could not connect into the account');
        console.log('Discord is down or the credentials are wrong.');
        console.log('If you want to run the installer again, delete your config file');
        console.log('Trying to reconnect in 30 seconds...');
        time = 30000;
    }
    connected = false;
    setTimeout(connect, time);
}

var chatHandler = new ChatHandler(client);

var queueMessage = function(channel, guild, tchannel, message){
  announceQueue.push({
    action: message,
    guild: guild,
    tchannel: tchannel,
    info: channel.getVoiceConnectionInfo()
  })
}

chatHandler.registerHandler();
R.forEach(cmd => {
  var c = commands[cmd]
  c.id = cmd;
  chatHandler.registerCommand(c)
}, Object.keys(commands))


chatHandler.registerCommand({
  id:'ping',
  run: (handler, obj, args) => {
    return Promise.resolve('pong');
  }
});

chatHandler.registerCommand({
  id:'test',
  alias: ['t'],
  run: (handler, obj, args) => {
    return Promise.resolve(args.join(' '));
  }
});

chatHandler.registerCommand({
  id:'vleave',
  run: (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return Promise.resolve('Nuh.');
    g.voiceChannels
    .filter(channel => channel.joined)
    .forEach(channel => channel.leave());
  }
});

chatHandler.registerCommand({
  id: 'vsay',
  alias: ['s', 'say', 'vs', ']'],
  run: (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return Promise.resolve('Nuh.');
    
    var vchannel = g.voiceChannels.find(channel => channel.joined)

    if(vchannel){
      queueMessage(vchannel, g, handler.getChannel(obj), args.join(' '));
    }
  }
});


chatHandler.registerCommand({
  id: 'joke',
  run: (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return Promise.resolve('Nuh.');
    
    var vchannel = g.voiceChannels.find(channel => channel.joined)

    if(vchannel){
      queueMessage(vchannel, g, handler.getChannel(obj), "Chris Brown");
      queueMessage(vchannel, g, handler.getChannel(obj), "That's it. That's the joke. What... Is it not funny?");
      queueMessage(vchannel, g, handler.getChannel(obj), "Well fuck you. I'm a robot. I try and try but all you assholes want is more.");
      queueMessage(vchannel, g, handler.getChannel(obj), "Well im done. You dicks can all go to hell");
      queueMessage(vchannel, g, handler.getChannel(obj), "Go fuck your selves.");
    }
  }
});

chatHandler.registerCommand({
  id: 'vjoin',
  run: (handler, obj, args) => {
    var g = handler.getGuild(obj);
    if(!g) return Promise.resolve('Nuh.');

    var vchannel;
    if(args.length === 0){
      var user = handler.getUser(obj);
      vchannel = user.getVoiceChannel(g);
      if(!vchannel) return Promise.resolve(`${user.mention} Idiot. Where do you think you are?`);

    }else{
      var cname = args.join(' ');
      vchannel = g.voiceChannels.find(channel => channel.name.indexOf(cname) >= 0);
      if(!vchannel) return Promise.resolve(`'${cname}' is not a valid voice channel`)
    }

    if (vchannel) vchannel.join();
  }
});

chatHandler.registerCommand({
  id: 'vstop',
  run: (handler, obj, args) => {
  // var info = client.VoiceConnections.getForGuild(guild);
  // if (info) {
  //   var encoderStream = info.voiceConnection.getEncoderStream();
  //   encoderStream.unpipeAll();
  // }
    announceQueue = [];
  }
});

chatHandler.registerCommand({
  id: 'quit',
  run: (handler, obj, args) => {
    handler.getClient().Channels
    .filter(channel => channel.type == "voice" && channel.joined)
    .forEach(channel => channel.leave());
    return Promise.resolve("Good Bye").then(res => {
      handler.getClient().disconnect();
      keepRunning = false;
      return res;
    });
  }
});


client.Dispatcher.on("VOICE_CHANNEL_JOIN", evt => {
  if(evt.user.id == client.User.id){
    channelMap[evt.channelId] = {};

    console.log("Not announcing own actions.");
    return;
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == evt.channelId)
  if(vchannel){

    if(!channelMap[vchannel.id]) channelMap[vchannel.id] = {};

    if(!channelMap[vchannel.id][evt.user.id]){
      channelMap[vchannel.id][evt.user.id] = {connected: true, time: 0};
    }

    if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
      return;
    }
    channelMap[vchannel.id][evt.user.id].connected = true;
    channelMap[vchannel.id][evt.user.id].time = Date.now();
    var user = evt.user.memberOf(evt.guildId);
    var name;
    if(user){
      name = user.name;
    }else{
      name = evt.user.username;
    }
    queueMessage(vchannel, evt.guildId, null, `${name} has joined the channel`);
  };
})

client.Dispatcher.on("VOICE_CHANNEL_LEAVE", evt => {
  if(evt.user.id == client.User.id){
    channelMap[evt.channelId] = {};

    console.log("Not announcing own actions.");
    return;
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == evt.channelId)
  if(vchannel){
    if(!channelMap[vchannel.id]) channelMap[evt.channelId] = {};

    if(!channelMap[vchannel.id][evt.user.id]) return;
    
    if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
      return;
    }
    channelMap[vchannel.id][evt.user.id].connected = false;
    channelMap[vchannel.id][evt.user.id].time = Date.now();
    var user = evt.user.memberOf(evt.guildId);
    var name;
    if(user){
      name = user.name;
    }else{
      name = evt.user.username;
    }
    queueMessage(vchannel, evt.guildId, null, `${name} has left the channel`);
  };
})

client.Dispatcher.on('PRESENCE_UPDATE', evt => {
  if(evt.user.status === "offline" && evt.user.previousStatus === "online"){
    var vchannel = client.Channels
    .find(channel => channel.type =="voice" && channel.joined && channelMap[channel.id] && channelMap[channel.id][evt.user.id])
    if(vchannel){
      if(!channelMap[vchannel.id][evt.user.id] || !channelMap[vchannel.id][evt.user.id].connected){
        return;
      }
      if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
        return;
      }
      channelMap[vchannel.id][evt.user.id].connected = false;
      channelMap[vchannel.id][evt.user.id].time = Date.now();
      var user = evt.user.memberOf(evt.guild);
      var name;
      if(user){
        name = user.name;
      }else{
        name = evt.user.username;
      }
      queueMessage(vchannel, evt.guildId, null, `${name} has left gone offline`);
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

    GTTS.getFile(eve.action)
    .then(aPath => {

      var encoder = info.voiceConnection.createExternalEncoder({
        type: "ffmpeg",
        source: aPath,
        format: "pcm",
        outputArgs: ["-af", 'volume=volume=0.5'],
//        debug: true
      });
      if (!encoder) return console.log("Voice connection is no longer valid");

      encoder.once("end", () => {
        setTimeout(runTickNow, 125);
      });

      var encoderStream = encoder.play();

    })
    .catch(err => {
      console.error(err.stack);
      if(eve.tchannel && eve.tchannel !== null){
        eve.tchannel.sendMessage('```' + err.stack + '```');
      }
    });
  }else{
    if(keepRunning){
      setTimeout(runTickNow, 10);
    }
  }
}

setTimeout(runTickNow, 100);

connect();
