import Vue from 'vue'

import config from '~/config'

Vue.filter('monitorAccount', function (account) {
  return `${config.monitor}/account/${account}`
})


Vue.prototype.$tokenLogo = function(symbol, contract) {
  if (symbol == 'PIXEOS' && contract == 'pixeos1token')
    return 'https://pixeos.io/ico/apple-touch-icon-57-precomposed.png'

  if (symbol == 'TKT' && contract == 'eossanguotkt')
    return require('@/assets/tokens/tkt_eossanguotkt.png')

  if (symbol == 'CHT' && contract == 'crheroes1cht')
    return require('@/assets/tokens/crheroes1cht-cht.png')

  return `https://raw.githubusercontent.com/BlockABC/eos-tokens/master/tokens/${contract}/${symbol}.png`
}
