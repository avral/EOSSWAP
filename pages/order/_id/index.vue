<template lang="pug">

el-card(v-if="!no_found" v-loading="loading").box-card.mt-3
  .clearfix(slot='header')
    span Order {{ id }} created by  
     a(:href="order.maker | monitorAccount" target="_blank") {{ order.maker }}

    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item(v-if="order.maker")
    .d-flex.justify-content-around
      .lead Sell  
        // TODO Implement token logos for this shit
        //TokenImage(:src="$tokenLogo(order.sell.quantity.split(' ')[1], order.sell.contract)" height="25").mr-2

        b {{ order.sell.quantity }}@
          a(:href="order.sell.contract | monitorAccount" target="_blank") {{ order.sell.contract }}

      .lead For 
        b {{ order.buy.quantity }}@
          a(:href="order.buy.contract | monitorAccount" target="_blank") {{ order.buy.contract }}
    hr 

    div(v-if="user")
      el-button(v-if="user && order.maker == user.name" type="warning" @click="cancelOrder").w-100 Cancel order
      el-button(v-else type="primary" @click="buy").w-100 Buy  
        |  {{ order.sell.quantity }}@{{ order.sell.contract }}
    div(v-else)
      el-button(@click="login()").w-100 Pleace login


el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Order: {{ id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center 
    h1.display-4 Order {{ id }} not found or finished
</template>


<script>
import TokenImage from '~/components/elements/TokenImage'

import config from '~/config'
import { transfer, cancelorder } from '~/store/chain.js'

import { mapGetters } from 'vuex'
import ScatterJS from 'scatterjs-core'


export default {
  components: {
    TokenImage
  },

  data() {
    return {
      id: 0,

      order: {},
      no_found: false,
      loading: true
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapGetters(['user'])
  },

  async created() {
    this.fetchOrder()
  },

  methods: {
    async login() {
      this.loading = true

      try {
        await this.$store.dispatch('chain/login')
      } catch (e) {
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
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async fetchOrder() {
      try {
        let r = await this.rpc.get_table_rows({
          code: config.contract,
          scope: config.contract,
          table: 'orders',
          lower_bound: this.id,
          limit: 1
        })

        let order = r.rows[0]

        if (order && order.id == this.id) {
          this.order = order
        } else {
          this.no_found = true
        }

      } catch (e) {
        this.$notify({ title: 'Error fetching order', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
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
