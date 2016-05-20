exports.constants = require './constants'

exports.client = (options) ->
    Client = require './client'
    new Client(options)

exports.redisCache = (options) ->
    RedisCache = require('./cache/redisCache')
    return new RedisCache(options)
