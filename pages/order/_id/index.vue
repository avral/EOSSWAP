<template lang="pug">

el-card(v-if="!no_found").box-card.mt-3
  .clearfix(slot='header')
    span Order {{ id }} created by  
     a(:href="order.maker | monitorAccount" target="_blank") {{ order.maker }}

    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item(v-if="order.maker")
    .d-flex.justify-content-around
      .lead Sell  
        b {{ order.sell.quantity }}@
          a(:href="order.sell.contract | monitorAccount" target="_blank") {{ order.sell.contract }}

      .lead For 
        b {{ order.buy.quantity }}@
          a(:href="order.buy.contract | monitorAccount" target="_blank") {{ order.buy.contract }}
    hr 

    el-button(type="primary" @click="buy").w-100 Buy  
      |  {{ order.sell.quantity }}@{{ order.sell.contract }}


el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Order: {{ id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center 
    h1.display-4 Order {{ id }} not found or finished
</template>


<script>
import { mapGetters } from 'vuex'

import config from '~/config'
import { transfer } from '~/store/chain.js'


export default {
  data() {
    return {
      id: 0,

      order: {},
      no_found: false,
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc']),
    ...mapGetters(['user'])
  },

  async created() {
    this.fetchOrder()
  },

  methods: {
    fetchOrder() {
      this.rpc.get_table_rows({
        code: config.contract,
        scope: config.contract,
        table: 'orders',
        lower_bound: this.id,
        limit: 1
      }).then(r => {
        let order = r.rows[0]

        if (order && order.id == this.id) {
          this.order = order
        } else {
          this.no_found = true
        }
      })
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
        await transfer(buy.contract, this.user.name, buy.quantity, `fill|${id}`)

        this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
        this.$router.push({ name: 'index' })
      } catch (e) {
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },
  },

  asyncData({ params }) {
    return params
  }
}
</script> 
