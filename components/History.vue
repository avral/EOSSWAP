<template lang="pug">
//el-table(:data="history", :prop="{prop: 'block_num', order: 'ascending'}" style='width: 100%')
el-table(:data="history", row-key="block_num'" style='width: 100%')
    el-table-column(prop='maker', label='Seller', width='125')
    el-table-column(prop='buyer', label='Buyer', width='125')
    el-table-column(label='Sell' width='200')
      template(slot-scope='scope')
        ShortToken(:token="scope.row.sell")

    el-table-column(label='Buy' width='200')
      template(slot-scope='scope')
        ShortToken(:token="scope.row.buy")

    el-table-column(prop='time', label='Time')
    el-table-column(prop='price', label='Price')
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import ShortToken from '~/components/elements/ShortToken'

import config from '~/config'

import { mapGetters } from 'vuex'

export default {
  components: {
    TokenImage,
    ShortToken
  },

  data() {
    return {
      history: [],
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc'])
  },

  created() {
    this.fetch()
  },

  methods: {
    async fetch() {
      let upper_bound
      this.history = []

      while(true) {
        // fetch all history
        let r

        try {
          r = await this.rpc.get_table_rows({
            code: config.contract,
            scope: config.contract,
            table: 'results',
            reverse: true,

            upper_bound
          })

          this.history = [
            ...this.history,
            ...r.rows.map(h => {
              let t = new Date(h.time * 1000).toLocaleString().split(':')
              h.time = t[0] + ':' + t[1] + ':' + t[2]

              let buyAmount = parseFloat(h.buy.quantity.split(' ')[0])
              let sellAmount = parseFloat(h.sell.quantity.split(' ')[0])

              let k = 1 / buyAmount
              let buy_price = (sellAmount * k).toFixed(4)

              h.price = `1 ${h.buy.quantity.split(' ')[1]} / ${buy_price} ${h.sell.quantity.split(' ')[1]}`

              h.buy.quantity = (buyAmount / 0.9975).toFixed(4) + ' ' + h.buy.quantity.split(' ')[1]
              h.sell.quantity = (sellAmount / 0.9975).toFixed(4) + ' ' + h.sell.quantity.split(' ')[1]

              return h
            })
          ]

        } catch(e) {
          this.$notify({ title: 'Load history', message: e.message, type: 'error' })
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
    }
  }
}

</script>
