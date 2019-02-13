<template lang="pug">
// TODO App need decomposition
div
  el-alert(title="Scatter in not connected:" :closable="false"  show-icon type="info" v-if="!scatterConnected")
    span.ml-2 Unlock or install  
    a(href="https://get-scatter.com/" target="_blank") Scatter
    i(@click="scatterConnect" size="mini").el-alert__closebtn Update

  el-tabs(type='border-card').mt-4
    el-tab-pane(label="Orders")
      .row
        .col
          .d-flex
            new-order-form(@submit="newOrder") Create new order

            .ml-auto
              span(v-if="user") Login as: 
                a(:href="'https://jungle.eosx.io/account/' + user.name" target="_blank") {{ $store.state.user.name }}
                el-button(v-if="user" size="mini" @click="logout").ml-2 logout

              el-button(@click="login" size="mini").ml-auto(v-if="!user") login
      .row
        .col
          el-table(:data="orders")
            el-table-column(label="ID" width="50")
              template(slot-scope='scope')
                //i.el-icon-time
                a(style='margin-left: 10px' href="#") {{ scope.row.id }}

            el-table-column(label="Owner" width="120")
              template(slot-scope="scope")
                .name-wrapper(slot="reference")
                  el-tag(size="medium") {{ scope.row.maker }}

            el-table-column(label="Sell / Buy")
              template(slot-scope="scope")
                span Sell: {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}
                |  for: {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

            el-table-column(label='Operations' width="100" v-if="user")
              template(slot-scope='scope')
                el-button(
                  v-if="scope.row.maker == user.name"
                  size='mini',
                  type="warning"
                  @click="cancelOrder(scope.row)"
                ) Cancel
                el-button(v-else size='mini', type="success" @click="buy(scope.row)") Buy

    el-tab-pane(label='My balances')
      el-alert(v-if="!user" title="Pleace login" :closable="false" show-icon type="info")

      el-table(v-else :data="user.balances", style='width: 100%')
        el-table-column(prop='contract', label='contract', width='230')
        el-table-column(prop='currency', label='currency', width='230')
        el-table-column(prop='amount', label='amount', width='230')
    el-tab-pane(label='History')
      history
    el-tab-pane(label='Settings')


</template>

<script>
import NewOrderForm from '~/components/NewOrderForm.vue'
import History from '~/components/History.vue'

import axios from 'axios'

import { mapGetters } from 'vuex'


export default {
  components: {
    NewOrderForm,
    History
  },

  data() {
    return {
      orders: [],
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

    async cancelOrder(order) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        await cancelorder(order.maker, order.id)

        this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
        this.fetch()
      } catch (e) {
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async scatterConnect() {
      try {
        this.scatterConnected = await ScatterJS.connect('Ordersbook', { network })
      } catch(e) {
        this.$notify({ title: 'Scatter error', message: e.message, type: 'error' })
      }
    },

    async login() {
      if(this.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for Scatter',
        });

        try {
          let r = await ScatterJS.login()

          this.$store.commit('setUser', r.accounts[0])
        } catch(e) {
          this.$notify({ title: 'Scatter login error', message: e.message, type: 'error' })
        } finally {
          loading.close()
          this.fetch()
        }
      } else {
        this.$notify({ title: 'Scatter not found', message: 'Pleace install or unlock Scatter', type: 'info' })
      }
    },

    async buy({ id, buy }) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        await tranfer(buy.contract, this.user.name, buy.quantity, `fill|${id}`)

        this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
        this.fetch()
      } catch (e) {
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async newOrder({ buy, sell }) {
      let quantity = `${sell.amount} ${sell.symbol}`
      let sell_quantity = `${buy.amount} ${buy.symbol}@${buy.contract}`

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        let r = await tranfer(sell.contract, this.user.name, quantity, `place|${sell_quantity}`)

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
      // Orders
      //rpc.get_table_rows({code: config.contract, scope: config.contract, table: 'orders'}).then(r => this.orders = r.rows)

      // User balances
      if (this.user) {
        axios.get(`https://lightapi.eosgeneva.io/api/account/jungle/${this.user.name}`).then(r => {
          this.$store.commit('setUser', { ...this.user, balances: r.data.balances })
        })
      }
    },
  }
}
</script>
