<template lang="pug">
//el-table(:data="history", :prop="{prop: 'block_num', order: 'ascending'}" style='width: 100%')
el-table(:data="history", row-key="block_num'" style='width: 100%')
    el-table-column(prop='maker', label='Seller', width='120')
    el-table-column(prop='buyer', label='Buyer', width='120')
    el-table-column(label='Sell' width='250')
      template(slot-scope='scope')
        TokenImage(:src="$tokenLogo(scope.row.sell.quantity.split(' ')[1], scope.row.sell.contract)" height="25")
        span.ml-2 {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}

    el-table-column(label='Buy' width='250')
      template(slot-scope='scope')
        TokenImage(:src="$tokenLogo(scope.row.buy.quantity.split(' ')[1], scope.row.buy.contract)" height="25")
        span.ml-2 {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

    el-table-column(prop='time', label='Time')
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'

import config from '~/config'

import { mapGetters } from 'vuex'

export default {
  components: {
    TokenImage
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
      let lower_bound
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

            lower_bound
          })

          this.history = [
            ...this.history,
            ...r.rows.map(h => {
              let t = new Date(h.time * 1000).toLocaleString().split(':')
              h.time = t[0] + ':' + t[1] + ' ' + t[2].split(' ')[1]

              let buyAmount = Number(h.buy.quantity.split(' ')[0])
              let sellAmount = Number(h.sell.quantity.split(' ')[0])

              h.buy.quantity = Math.round(buyAmount / 0.9975).toFixed(4) + ' ' + h.buy.quantity.split(' ')[1]
              h.sell.quantity = Math.round(sellAmount / 0.9975).toFixed(4) + ' ' + h.buy.quantity.split(' ')[1]

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
          lower_bound = r.rows[r.rows.length - 1].id - 1
        } else {
          break
        }
      }
    }
  }
}

</script>
