"use strict";

class EventHandler {

  constructor(bot){
    this.bot = bot;
  }

  getBot(){
    return this.bot;
  }

  getChannel(evt){

  }

  getUserNick(userObj, guildObj){
    if(userObj instanceof String){
      userObj = this.bot.Users.
    }
    if(guildObj == null) return userObj.username;
    var user = e.user.memberOf(e.guild);
    var name;
    if(user){
      name = user.name;
    }else{
      name = e.user.username;
    }
  }




}


