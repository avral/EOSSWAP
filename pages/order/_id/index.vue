<template lang="pug">

el-card(v-if="!no_found" v-loading="loading").box-card.mt-3
  .clearfix(slot='header')
    span Order {{ order.id }} created by  
     a(:href="order.maker | monitorAccount" target="_blank") {{ order.maker }}

    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item(v-if="order.maker")
    .row.mb-3
      .col-6.text-center.bordered
        h2 Sell

        hr

        TokenImage(:src="$tokenLogo(order.sell.quantity.split(' ')[1], order.sell.contract)" height="50").mr-2.mb-2

        .lead {{ order.sell.quantity }}@
          a(:href="order.sell.contract | monitorAccount" target="_blank") {{ order.sell.contract }}
      .col-6.text-center
        h2 Buy

        hr

        TokenImage(:src="$tokenLogo(order.buy.quantity.split(' ')[1], order.buy.contract)" height="50").mr-2.mb-2

        .lead {{ order.buy.quantity }}@
          a(:href="order.buy.contract | monitorAccount" target="_blank") {{ order.buy.contract }}

    div(v-if="user")
      el-button(v-if="user && order.maker == user.name" type="warning" @click="cancelOrder").w-100 Cancel order
      el-button(v-else type="primary" @click="buy").w-100 Buy  
        |  {{ order.sell.quantity }}@{{ order.sell.contract }}
    div(v-else)
      el-button(@click="login").w-100 Pleace login


el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Order: {{ id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center 
    h1.display-4 Order {{ id }} not found or finished
</template>


<script>
import TokenImage from '~/components/elements/TokenImage'
import { captureException } from '@sentry/browser'


import config from '~/config'
import { transfer, cancelorder } from '~/store/chain.js'

import { mapGetters } from 'vuex'
import ScatterJS from 'scatterjs-core'


export default {
  head() {
    return {
      title: `EOSSWAP | Sell ${this.order.sell.quantity} for ${this.order.buy.quantity} by omgnoob4ever`
    }
  },

  components: {
    TokenImage
  },

  data() {
    return {
      order: {},
      no_found: false,
      loading: true
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapGetters(['user'])
  },

  async asyncData({ store, error, params }) {
    const rpc = store.getters['chain/rpc']

    try {
      let r = await rpc.get_table_rows({
        code: config.contract,
        scope: config.contract,
        table: 'orders',
        lower_bound: params.id,
        limit: 1
      })

      let order = r.rows[0]

      if (order && order.id == params.id) {
        return { order, loading: false }
      } else {
        // TODO Redirect if order in history
        error({ message: `Order ${params.id} not found or finished`, statusCode: 404 })
      }

    } catch (e) {
      captureException(e)
      return error({ message: 'Error fetching order: ' + e, statusCode: 500 })
    }
  },

  methods: {
    async login() {
      this.loading = true

      try {
        await this.$store.dispatch('chain/login')
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Loading error', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    async cancelOrder(order) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      try {
        let order = this.order;

        await cancelorder(order.maker, order.id)

        this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
        this.$router.push({ name: 'index' })
      } catch (e) {
        captureException(e, {extra: { order }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async fetchOrder() {
    },

    async buy() {
      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        type: 'info'
      })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter',
      });

      if (this.$store.state.chain.scatterConnected && !this.$store.state.user)
        await this.$store.dispatch('chain/login')

      try {
        let { buy, sell, id } = this.order
        let r = await transfer(buy.contract, this.user.name, buy.quantity, `fill|${id}`)

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: action => {
            this.$router.push({ name: 'index' })
            this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
          }
        });
      } catch (e) {
        captureException(e, {extra: { order: this.order }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },
  },
}
</script> 

<style>
.bordered {
  border-right: 1px solid;
}
</style>
