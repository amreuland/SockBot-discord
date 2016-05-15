'use strict';

const R = require('ramda');
const Promise = require('bluebird');
// const SuperError = require('super-error');

// const lol_champions = require('')
const conf = require('config');
const lol = require('lol-js');

const Command = require('lib/command/Command');

var lolClient = lol.client({
  apiKey: conf.league.api_keys.riot,
  cache: lol.redisCache({
    host: '127.0.0.1',
    port: 6379,
    keyPrefix: 'loljs'
  })
});


class InvalidRegionError extends Error { constructor(args){ super(args); }}
class NotInGameError extends Error { constructor(args){ super(args); }}
class UserNotFound extends Error { constructor(args){ super(args); }}
class ChampionInfoError extends Error { constructor(args){ super(args); }}

const CONST_REGIONS = ['br', 'eune', 'euw', 'kr', 'lan', 'las', 'na', 'oce', 'ru', 'tr'];

function _validateRegion(region){
  return Promise.resolve(region).then(r =>{
    if(R.is(Object, r)) r = r.region;
    if(R.contains(r.toLowerCase(), CONST_REGIONS)) return r.toLowerCase();
    throw new InvalidRegionError(r);
  })
}

function _getMatchSummoners(region, name, summId) {
  return lolClient.getCurrentMatch(region, summId)
  .then(data => {
    console.log(data);
    if(!data || data === null) return Promise.reject(new Error(`**${name}** is not in a game.`));

    return R.prop('participants');
  })
}

function matchDetails(handler, evt, args){
  
  var errs = [];

  var region = args.shift();
  if(!region) errs.push('No region provided');
  
  var summoner = args.shift();
  if(!summoner) errs.push('No summoner provided');

  if(errs.length >= 1) return Promise.reject(new Command.UsageError(errs));

  return Promise.resolve(region)
  .then(_validateRegion)
  .catch(InvalidRegionError, e => Promise.resolve(`Error: \`${e.message}\` is not a valid region.`))
  .catch(NotInGameError, e => Promise.resolve(`\`${e.message}\` is not currently in a match.`))
}

module.exports = {
  matchDetails: matchDetails
}


// _getMatchSummoners('na', 'nitsura', '64833486').then(console.log).catch(console.error);