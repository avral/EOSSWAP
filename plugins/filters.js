import Vue from 'vue'

import config from '~/config'

Vue.filter('monitorAccount', function (account) {
  return `${config.monitor}/account/${account}`
})
