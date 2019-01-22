<template lang="pug">
div
  .display-4 Orderbook: eosio.token exchanger
  el-alert(title="Scatter in not connected" :closable="false" type="warning"
  v-if="!scatterConnected").d-flex
    i(@click="scatterConnect" size="mini").el-alert__closebtn Update

  el-tabs(type='border-card').mt-4
    el-tab-pane(label="Orders")
      .row
        .col
          .d-flex
            //el-select(v-model="value10" filterable default-first-option, placeholder="Change from")
            //  el-option(v-for="asset in balances", :key="asset.funds", :label="asset.funds", :value="asset.funds")

            //i.el-icon-arrow-right.align-self-center.ml-4

            //el-select(v-model='value10' filterable default-first-option, placeholder='Change to').ml-4
            //  el-option(v-for='item in options', :key='item.value', :label='item.label', :value='item.value')

            new-order-form(@submit="newOrder") Create new order

            .ml-auto
              .lead(v-if="user") Login as: {{ $store.state.user.name }}
              .lead(v-if="user")
                el-button(size="mini" @click="logout") logout


              el-button(@click="login").ml-auto(v-if="!user") login
      .row
        .col
          el-table(:data="orders")
            el-table-column(label="Order id" width="100")
              template(slot-scope='scope')
                //i.el-icon-time
                span(style='margin-left: 10px') {{ scope.row.id }}

            el-table-column(label="Owner" width="100")
              template(slot-scope="scope")
                .name-wrapper(slot="reference")
                  el-tag(size="medium") {{ scope.row.maker }}

            el-table-column(label="Sell / Buy")
              template(slot-scope="scope")
                span Sell: {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}
                |  for: {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

            el-table-column(label='Operations' width="100")
              template(slot-scope='scope')
                el-button(size='mini', type="success" @click="buy(scope.row)") Buy

    el-tab-pane(label='My balances')
      el-table(v-if="user" :data="user.balances", style='width: 100%')
        el-table-column(prop='contract', label='contract', width='230')
        el-table-column(prop='currency', label='currency', width='230')
        el-table-column(prop='amount', label='amount', width='230')
    el-tab-pane(label='History')
      el-table(:data="history", style='width: 100%')
        el-table-column(prop='block_time', label='Date', width='230')
        el-table-column(prop='action_trace.act.account', label='Token account', width='180')
        el-table-column(prop='action_trace.act.authorization[0].actor', label='Maker')
        el-table-column(prop='action_trace.act.name', label='Operation')
    el-tab-pane(label='Settings')


</template>

<script>
import NewOrderForm from '~/components/NewOrderForm.vue'
import config from '~/config/dev.js'

import axios from 'axios'
import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'
import { Api, JsonRpc, RpcError } from 'eosjs'

import { mapGetters } from 'vuex'


ScatterJS.plugins(new ScatterEOS())

const network = ScatterJS.Network.fromJson({
      blockchain: 'eos',
      ...config
});

const rpc = new JsonRpc(config.host, { fetch });
const eos = ScatterJS.eos(network, Api, {rpc, beta3:true})

// TODO Dev setup
//import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';
//const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
//const defaultPrivateKey = "5JTQrUhAhAVmcHdjREL1D3UxmBvCq69jupABgyA28SAtVGp8iMs"; // user bob
//const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
//const eos = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

// To Utils
function tranfer(contract, actor, quantity, memo) {
  return eos.transact({
     actions: [{
         account: contract,
         name: 'transfer',
         authorization: [{
             actor: actor, // FIXME Here should be current user
             permission: 'active',
         }],
         data: {
             from: actor,
             to: config.contract, // contract name from config
             quantity,
             memo,
         },
     }]
   }, { blocksBehind: 3, expireSeconds: 3 * 60 }
  )
}

export default {
  components: {
    NewOrderForm
  },

  data() {
    return {
      orders: [],
      history: [],
      scatterConnected: false,

      to_assets: [],

      select: {
        from: '',
        to: ''
      },
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  created() {
    this.fetch()
    this.scatterConnect()
  },

  methods: {
    logout() {
      ScatterJS.logout().then(this.$store.commit('setUser', null));
    },

    async scatterConnect() {
      try {
        this.scatterConnected = await ScatterJS.connect('Ordersbook', { network })
      } catch(e) {
        this.$notify({ title: 'Scatter error', message: e.message, type: 'error' })
      }
    },

    async login() {
      this.loginLoading = true

      if(this.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for Scatter',
        });

        try {
          let r = await ScatterJS.login()
          let account = r.accounts[0]

          let { data: { balances }} = await axios.get(`https://lightapi.eosgeneva.io/api/account/jungle/${account.name}`)
          account.balances = balances
          this.$store.commit('setUser', account)
        } catch(e) {
          this.$notify({ title: 'Scatter login error', message: e.message, type: 'error' })
        } finally {
          loading.close()
        }

      }
    },

    async buy({ id, buy }) {
      let memo = JSON.stringify({
        action: "fill",
        order_id: id
      })

      try {
        await tranfer(buy.contract, this.user.name, buy.quantity, memo)
        this.$notify({ title: 'Success', message: 'This is a success message', type: 'success' })
        this.fetch()
      } catch (e) {
        console.log(e)
      }
    },

    async newOrder({ buy, sell }) {
      let quantity = `${sell.amount} ${sell.symbol}`
      let sell_quantity = `${buy.amount} ${buy.symbol}@${buy.contract}`

      let memo = JSON.stringify({
        action: "place",
        e_asset: sell_quantity
      })

      //const h = this.$createElement;

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        let r = await tranfer(sell.contract, this.user.name, quantity, memo)
        this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
        this.fetch()
      } catch (e) {
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close();
      }
    },

    async fetch() {
      rpc.get_table_rows({code: config.contract, scope: config.contract, table: 'orders'}).then(r => this.orders = r.rows)
      //rpc.get_table_rows({code: 'ordersbook', scope: 'alice', table: 'balances'}).then(r => this.balances = r.rows)

      rpc.history_get_actions(config.contract).then(r => {
        this.history = r.actions.filter(h => {
          return !(['setcode', 'setabi'].includes(h.action_trace.act.name)) && h.action_trace.act.authorization[0].actor != config.contract
        })
      })
    },
  }
}
</script>
