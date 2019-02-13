import config from '~/config'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'
import { Api, JsonRpc, RpcError } from 'eosjs'

ScatterJS.plugins(new ScatterEOS())

const network = ScatterJS.Network.fromJson({
      blockchain: 'eos',
      ...config
});

const rpc = new JsonRpc(config.host, { fetch });
const eos = ScatterJS.eos(network, Api, {rpc, beta3:true})


export const state = () => ({
  scatterConnected: true,

})

export const actions = {
  async init({ commit, dispatch }) {
    console.log('App starting..')

    ScatterJS.connect('Ordersbook', { network }).then(v => commit('setScatterConnected', v))
  },

  logout({ commit }) {
    ScatterJS.logout().then(commit('setUser', null, { root: true }));
  },

  async login({ state, commit, dispatch }) {
    let r = await ScatterJS.login()

    commit('setUser', r.accounts[0], { root: true })
    dispatch('loadUserBalances', {}, { root: true })
  },

  async scatterConnect({ commit }) {
    commit('setScatterConnected', await ScatterJS.connect('Ordersbook', { network }))
  },

  getOrders() {
    return rpc.get_table_rows({code: config.contract, scope: config.contract, table: 'orders'})
  }
}

export const mutations = {
  setUser: (state, user) => state.user = user,
  setScatterConnected: (state, value) => state.scatterConnected = value,
}

export const getters = {
  rpc: state => rpc,
  eos: state => eos
}

export function transfer(contract, actor, quantity, memo) {
  return eos.transact({
     actions: [{
         account: contract,
         name: 'transfer',
         authorization: [{
             actor: actor,
             permission: 'active',
         }],
         data: {
             from: actor,
             to: config.contract,
             quantity,
             memo,
         },
     }]
   }, { blocksBehind: 3, expireSeconds: 3 * 60 }
  )
}

export function cancelorder(maker, order_id) {
  return eos.transact({
     actions: [{
         account: config.contract,
         name: 'cancelorder',
         authorization: [{
             actor: maker,
             permission: 'active',
         }],
         data: { maker, order_id }, }]
   }, { blocksBehind: 3, expireSeconds: 3 * 60 }
  )
}
