'use strict'

const Promise = require('bluebird')
const Discord = require('discordie')
const path = require('path')
const async = require('async')
const fs = require('fs')
const R = require('ramda')
const conf = require('config')

const GoogleTTS = require('lib/GoogleTTS')
const ChatHandler = require('lib/handlers/ChatHandler')
const { Markdown:M } = require('lib/StringUtils')
const { UsageError } = require('lib/command/Errors')
const { SimpleCommand, TextCommand } = require('lib/command/Command')

const commands = require('commands/')
// console.log(commands)

var timeoutTime = 10000

var client = new Discord({
  autoReconnect: true
})

var GTTS = new GoogleTTS(conf.tts.cache)

var admins = conf.admins

var channelMap = {}

var keepRunning = true

var announceQueue = []

var connected = false

function connect() {
    client.Dispatcher.removeListener(Discord.Events.GATEWAY_READY, handleConnection)
    client.Dispatcher.removeListener(Discord.Events.DISCONNECTED, handleDisconnection)
    client.Dispatcher.once(Discord.Events.GATEWAY_READY, handleConnection)
    client.Dispatcher.once(Discord.Events.DISCONNECTED, handleDisconnection)

    console.log('Trying to connect...')
    client.connect({token: conf.token})
}

function handleConnection(evt) {
  console.log(`Connected as: ${client.User.username}`)

  client.User.setStatus('online', {name: 'Half-Life 3'})

  var vchannel =
    client.Channels
    .find(channel => channel.type == "voice" && channel.name.indexOf('General') >= 0)

  // if (vchannel) vchannel.join()

  connected = true
}

function handleDisconnection(evt) {
    console.log("DISCONNECTED!!!!!")
    console.log(evt)
    var time
    if(connected) {
        console.log('The bot has disconnected')
        console.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
        // time = 10000
    } else {
        console.log('Could not connect into the account')
        console.log('Discord is down or the credentials are wrong.')
        console.log(`Trying to reconnect in ${evt.delay} milliseconds...`)
        // time = 30000
    }
    connected = false
    // setTimeout(connect, time)
}

var chatHandler = new ChatHandler(client)

var queueMessage = function(channel, guild, tchannel, message){
  announceQueue.push({
    action: message,
    guild: guild,
    tchannel: tchannel,
    vchannel: channel
  })
}

chatHandler.registerHandler()
R.forEach(cmd => chatHandler.registerCommand(cmd), commands)


chatHandler.registerCommand(new TextCommand({
  id: 'ping',
  text: 'Pong!',
  categories: ['fun'],
  description: 'Pong!'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'test',
  aliases: ['t'],
  categories: ['system'],
  run: (handler, obj, args) => Promise.resolve(args.join(' ')),
  description: 'Repeat what I say'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'vleave',
  categories: ['voice'],
  run: (handler, obj, args) => {
    var g = handler.getGuild(obj)
    if(!g) return Promise.resolve('No server found in relation to this message.')
    g.voiceChannels
    .filter(channel => channel.joined)
    .forEach(channel => channel.leave())
  },
  description: 'Disconnect SockBot from voice chat'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'vsay',
  aliases: ['s', 'say', 'vs', ']'],
  categories: ['voice'],
  parameters: ['<message>'],
  run: (handler, obj, args) => {
    return
    var g = handler.getGuild(obj)
    if(!g) return Promise.resolve('Nuh.')
    
    var vchannel = g.voiceChannels.find(channel => channel.joined)

    if(args.length <= 0){
      return Promise.reject(new UsageError(['No Message Provided']))
    }

    if(vchannel){
      queueMessage(vchannel, g, handler.getChannel(obj), args.join(' '))
    } else {
      return Promise.resolve('Error: Not connected to a Voice Channel')
    }
  },
  description: 'Make SockBot say something. Uses Google Translate TTS.'
}))


chatHandler.registerCommand(new SimpleCommand({
  id: 'joke',
  categories: ['fun'],
  run: (handler, obj, args) => {
    return
    var g = handler.getGuild(obj)
    if(!g) return Promise.resolve('Nuh.')
    
    var vchannel = g.voiceChannels.find(channel => channel.joined)

    if(vchannel){
      queueMessage(vchannel, g, handler.getChannel(obj), "Chris Brown")
      queueMessage(vchannel, g, handler.getChannel(obj), "That's it. That's the joke. What... Is it not funny?")
      queueMessage(vchannel, g, handler.getChannel(obj), "Well fuck you. I'm a robot. I try and try but all you assholes want is more.")
      queueMessage(vchannel, g, handler.getChannel(obj), "Well im done. You dicks can all go to hell")
      queueMessage(vchannel, g, handler.getChannel(obj), "Go fuck your selves.")
    }
  },
  description: 'It\'s a joke?'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'vjoin',
  parameters: ['[voice channel]'],
  categories: ['voice'],
  run: (handler, obj, args) => {
    return
    var g = handler.getGuild(obj)
    if(!g) return

    var vchannel
    if(args.length === 0){
      var user = handler.getUser(obj)
      vchannel = user.getVoiceChannel(g)
      if(!vchannel) return Promise.resolve(`${user.mention} Idiot. Where do you think you are?`)

    }else{
      var cname = args.join(' ')
      vchannel = g.voiceChannels.find(channel => channel.name.indexOf(cname) >= 0)
      if(!vchannel){
        return Promise.resolve(`Error: ${M.bold(cname)} is not a valid voice channel`)
      }
    }

    if (vchannel) vchannel.join()
  },
  description: 'Make SockBot join the same voice channel as the user.\nIf supplied with a channel name, join that channel instead.'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'vstop',
  categories: ['voice'],
  run: (handler, obj, args) => {
    return
  // var info = client.VoiceConnections.getForGuild(guild)
  // if (info) {
  //   var encoderStream = info.voiceConnection.getEncoderStream()
  //   encoderStream.unpipeAll()
  // }
    announceQueue = []
  },
  description: 'Make SockBot stop talking (May not work. SockBot likes to talk.)'
}))

chatHandler.registerCommand(new SimpleCommand({
  id: 'quit',
  categories: ['system'],
  run: (handler, obj, args) => {
    handler.getClient().Channels
    .filter(channel => channel.type == "voice" && channel.joined)
    .forEach(channel => channel.leave())
    return Promise.resolve("Good Bye").then(res => {
      handler.getClient().disconnect()
      keepRunning = false
      return res
    })
  },
  description: 'Shutdown the bot'
}))

chatHandler.finalize()


client.Dispatcher.on("VOICE_CHANNEL_JOIN", evt => {
  if(evt.user.id == client.User.id){
    channelMap[evt.channelId] = {}

    console.log("Not announcing own actions.")
    return
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == evt.channelId)
  if(vchannel){

    if(!channelMap[vchannel.id]) channelMap[vchannel.id] = {}

    if(!channelMap[vchannel.id][evt.user.id]){
      channelMap[vchannel.id][evt.user.id] = {connected: true, time: 0}
    }

    if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
      return
    }
    channelMap[vchannel.id][evt.user.id].connected = true
    channelMap[vchannel.id][evt.user.id].time = Date.now()
    var user = evt.user.memberOf(evt.guildId)
    var name
    if(user){
      name = user.name
    }else{
      name = evt.user.username
    }
    queueMessage(vchannel, evt.guildId, null, `${name} has joined the channel`)
  }
})

client.Dispatcher.on("VOICE_CHANNEL_LEAVE", evt => {
  if(evt.user.id == client.User.id){
    channelMap[evt.channelId] = {}

    console.log("Not announcing own actions.")
    return
  }
  var vchannel = client.Channels
  .find(channel => channel.type == "voice" && channel.joined && channel.id == evt.channelId)
  if(vchannel){
    if(!channelMap[vchannel.id]) channelMap[evt.channelId] = {}

    if(!channelMap[vchannel.id][evt.user.id]) return
    
    if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
      return
    }
    channelMap[vchannel.id][evt.user.id].connected = false
    channelMap[vchannel.id][evt.user.id].time = Date.now()
    var user = evt.user.memberOf(evt.guildId)
    var name
    if(user){
      name = user.name
    }else{
      name = evt.user.username
    }
    queueMessage(vchannel, evt.guildId, null, `${name} has left the channel`)
  }
})

client.Dispatcher.on('PRESENCE_UPDATE', evt => {
  if(evt.user.status === "offline" && evt.user.previousStatus === "online"){
    var vchannel = client.Channels
    .find(channel => channel.type =="voice" && channel.joined && channelMap[channel.id] && channelMap[channel.id][evt.user.id])
    if(vchannel){
      if(!channelMap[vchannel.id][evt.user.id] || !channelMap[vchannel.id][evt.user.id].connected){
        return
      }
      if(Date.now() - channelMap[vchannel.id][evt.user.id].time < timeoutTime){
        return
      }
      channelMap[vchannel.id][evt.user.id].connected = false
      channelMap[vchannel.id][evt.user.id].time = Date.now()
      var user = evt.user.memberOf(evt.guild)
      var name
      if(user){
        name = user.name
      }else{
        name = evt.user.username
      }
      queueMessage(vchannel, evt.guildId, null, `${name} has gone offline`)
    }
  }
})

function runTickNow() {
  if(announceQueue.length){
    var eve = announceQueue.shift()
    if (!client.VoiceConnections.length) {
      return console.log("Voice not connected")
    }
    var info = eve.vchannel.getVoiceConnectionInfo()

    GTTS.getFile(eve.action)
    .then(aPath => {

      var source = fs.createReadStream(aPath + ".opus")
      var encoder = info.voiceConnection.createExternalEncoder({
        type: "OggOpusPlayer",
        source: source,
        format: "opus",
        frameDuration: 60,
        outputArgs: ["-af", 'volume=volume=0.5'],
        debug: true
      })
      if (!encoder) {
        // setTimeout(runTickNow, 125)
        return console.log("Voice connection is no longer valid")
      }

      encoder.on('end', () => {
        console.log("ENDED")
        // setTimeout(runTickNow, 125)
      })

      encoder.once("error", err => console.log("Ogg Error", err))

      var encoderStream = encoder.play()

      encoderStream.once("unpipe", () => source.destroy())

    })
    .catch(err => {
      console.error(err.stack)
      if(eve.tchannel && eve.tchannel !== null){
        eve.tchannel.sendMessage(M.code(err.stack))
      }
    })
  }
  // }else{
    if(keepRunning){
      setTimeout(runTickNow, 10)
    }
        // setTimeout(runTickNow, 125)
  // }
}

// setTimeout(runTickNow, 100)

connect()
