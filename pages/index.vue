<template lang="pug">
// TODO App need decomposition
div
  el-tabs(type='border-card').mt-4
    el-tab-pane(label="Orders" v-loading="loading")
      .row
        .col
          .d-flex
            new-order-form(@submit="newOrder") Create new order

            el-input(size="small" v-model="search" placeholder="Filter by token").ml-4.mr-4

            .ml-auto
              span(v-if="user") Login as: 
                a(:href="'https://jungle.eosx.io/account/' + user.name" target="_blank") {{ $store.state.user.name }}
                el-button(v-if="user" size="mini" @click="logout").ml-2 logout

              el-button(@click="login" size="small").ml-auto(v-if="!user") login
      .row
        .col
          el-table(:data="filteredItems")
            el-table-column(label="ID" width="50")
              template(slot-scope='scope')
                //i.el-icon-time
                nuxt-link(:to="{name: 'order-id', params: {id: scope.row.id }}" style='margin-left: 10px') {{ scope.row.id }}

            el-table-column(label="Owner" width="120")
              template(slot-scope="scope")
                .name-wrapper(slot="reference")
                  el-tag(size="medium") {{ scope.row.maker }}

            el-table-column(label="Sell / Buy")
              template(slot-scope="scope")
                span Sell: {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}
                |  for: {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

            el-table-column(label='' width="100")
              template(slot-scope='scope')
                //el-button(
                //  v-if="scope.row.maker == user.name"
                //  size='mini',
                //  type="warning"
                //  @click="cancelOrder(scope.row)"
                //) Cancel
                //el-button(v-else size='mini', type="success" @click="buy(scope.row)") Buy
                el-button(@click="$router.push({name: 'order-id', params: {id: scope.row.id }})" size='mini') Show

    el-tab-pane(label='My balances')
      el-alert(v-if="!user" title="Pleace login" :closable="false" show-icon type="info")

      el-table(v-else :data="user.balances", style='width: 100%')
        el-table-column(prop='contract', label='contract')
        el-table-column(prop='currency', label='currency')
        el-table-column(prop='amount', label='amount')
    el-tab-pane(label='History')
      history

</template>

<script>
import NewOrderForm from '~/components/NewOrderForm.vue'
import History from '~/components/History.vue'

import axios from 'axios'

import config from '~/config'
import { mapGetters } from 'vuex'
import { transfer } from '~/store/chain.js'


export default {
  components: {
    NewOrderForm,
    History
  },

  data() {
    return {
      orders: [],
      search: '',

      to_assets: [],

      select: {
        from: '',
        to: ''
      },

      loading: true
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc']),

    filteredItems() {
      return this.orders.filter(i => {
        if(i.buy.quantity.toLowerCase().indexOf(this.search.toLowerCase()) > -1)
          return true

        if(i.sell.quantity.toLowerCase().indexOf(this.search.toLowerCase()) > -1)
          return true
      });
    }
  },

  created() {
    this.fetch()
  },

  methods: {
    async logout() {
      await this.$store.dispatch('chain/logout')
    },

    async login() {
      if(this.$store.state.chain.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for Scatter',
        });

        try {
          await this.$store.dispatch('chain/login')
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
        let r = await transfer(sell.contract, this.user.name, quantity, `place|${sell_quantity}`)

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
      // TODO Подгрузка с прокруткой
      this.loading = true

      try {
        let r = await this.rpc.get_table_rows({code: config.contract, scope: config.contract, table: 'orders'})
        this.orders = r.rows
      } catch(e) {
        this.$notify({ title: 'Load orders', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    },
  }
}
</script>
