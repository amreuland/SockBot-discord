'use strict'

module.exports = {
  genUrl: (region, rest) => `https://${region}.api.pvp.net/api/lol/${region}/v${rest.version}/${rest.name}`
}
