<template lang="pug">
// TODO App need decomposition
div
  el-tabs(type='border-card').mt-4
    el-tab-pane(label="Orders" v-loading="loading")
      .row
        .col
          .d-flex
            new-order-form(@submit="newOrder" v-if="user").mr-2 Create new order

            el-input(size="small" v-model="search" placeholder="Filter by token").ml-2.mr-4

            .ml-auto
              span(v-if="user")
                a(:href="'https://jungle.eosx.io/account/' + user.name" target="_blank") {{ $store.state.user.name }}
                el-button(v-if="user" size="mini" @click="logout").ml-3 logout

              el-button(@click="login" type="primary" size="small").ml-auto(v-if="!user") Sign In via Scatter
      .row
        .col
          el-table(:data="filteredItems" @row-click="clickOrder" row-class-name="order-row")
            el-table-column(label="ID" width="50")
              template(slot-scope='scope')
                //i.el-icon-time
                nuxt-link(:to="{name: 'order-id', params: {id: scope.row.id }}" style='margin-left: 10px') {{ scope.row.id }}

            el-table-column(label="Owner" width="130")
              template(slot-scope="scope")
                .name-wrapper(slot="reference")
                  el-tag(size="medium") {{ scope.row.maker }}

            el-table-column(label="Sell")
              template(slot-scope="scope")
                TokenImage(:src="$tokenLogo(scope.row.sell.quantity.split(' ')[1], scope.row.sell.contract)" height="25")
                span.ml-2 {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}

            el-table-column(label="Buy")
              template(slot-scope="scope")
                TokenImage(:src="$tokenLogo(scope.row.buy.quantity.split(' ')[1], scope.row.buy.contract)" height="25")
                span.ml-2 {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

            el-table-column(label="Price" width="250")
              template(slot-scope="scope")
                span.ml-2 {{ scope.row.price }}

    el-tab-pane(label='My balances')
      el-alert(v-if="!user" title="Pleace login" :closable="false" show-icon type="info")

      el-table(v-else :data="user.balances", style='width: 100%')
        el-table-column(label='currency')
          template(slot-scope="scope")
            TokenImage(:src="$tokenLogo(scope.row.currency, scope.row.contract)" height="25")
            span.ml-2 {{ scope.row.currency }}

        el-table-column(prop='contract', label='contract')
        el-table-column(prop='amount', label='amount')
    el-tab-pane(label='History')
      history

    el-tab-pane(label='Rules & Information')
      h4.ml-3.mt-3 Properties:
        ul.mt-1
          li.lead All the logic of order storage and exchange takes place in the contract, without any additional centralized solutions.
          li.lead The exchange works automatically, without the possibility of third parties to influence the work of the contract.
          li.lead This application works without centralized back-end and uses only the public EOS node.
          li.lead Each exchange is charged a commission of 0.25% for both tokens.

      h4.ml-3 Roadmap:
        ul.mt-1
          li.lead Global redesign of the application.
          li.lead The web application will be published in open source. And contract later.
          li.lead Development of additional services for easy search, sorting and working with orders.

      h4.ml-3 Audit:
        ul.mt-1
          li.lead Exchange contract: 
            a(:href="'wwweosswapio' | monitorAccount" target="_blank") wwweosswapio

          li.lead Comission account: 
            a(:href="'eosswapdivs1' | monitorAccount" target="_blank") eosswapdivs1

</template>

<script>
import { captureException } from '@sentry/browser'

import NewOrderForm from '~/components/NewOrderForm.vue'
import History from '~/components/History.vue'
import TokenImage from '~/components/elements/TokenImage'

import axios from 'axios'

import config from '~/config'
import { mapGetters } from 'vuex'
import { transfer } from '~/store/chain.js'


export default {
  components: {
    NewOrderForm,
    History,
    TokenImage
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

      loading: true,
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
    async clickOrder(a) {
      this.$router.push({name: 'order-id', params: {id: a.id }})
    },

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
          captureException(e)
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
        captureException(e, {extra: {buy, id}})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async newOrder({ buy, sell }) {
      let quantity = `${sell.amount.toFixed(4)} ${sell.symbol}`
      let sell_quantity = `${buy.amount.toFixed(4)} ${buy.symbol}@${buy.contract}`

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        let r = await transfer(sell.contract, this.user.name, quantity, `place|${sell_quantity}`)

        this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
        this.fetch()
      } catch (e) {
        captureException(e, {extra: {buy, sell}})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close();
      }
    },

    async fetch() {
      // TODO Подгрузка с прокруткой
      this.loading = true
      this.orders = []

      let upper_bound = undefined

      while(true) {
        // fetch all orders
        let r

        try {
          r = await this.rpc.get_table_rows({
            code: config.contract,
            scope: config.contract,
            table: 'orders',
            reverse: true,

            upper_bound
          })

          r.rows = r.rows.map(r => {
            let sell = r.sell.quantity.split(' ')
            let buy = r.buy.quantity.split(' ')

            let k = 1 / parseFloat(buy[0])
            let buy_price = (parseFloat(sell[0]) * k).toFixed(4)

            r.price = `1 ${buy[1]} / ${buy_price} ${sell[1]}`

            return r
          })

          this.orders = [...this.orders, ...r.rows]
        } catch(e) {
          captureException(e)
          this.$notify({ title: 'Load orders', message: e.message, type: 'error' })
          break
        } finally {
          this.loading = false
        }

        if(r.rows.length > 1) {
          upper_bound = r.rows[r.rows.length - 1].id - 1
          if (upper_bound < 0) break
        } else {
          break
        }
      }
    },
  }
}
</script>



<style>
.order-row {
  cursor: pointer;
}
</style>
