<template lang="pug">
//el-table(:data="history", :prop="{prop: 'block_num', order: 'ascending'}" style='width: 100%')
el-table(:data="history", row-key="block_num'" style='width: 100%')
    el-table-column(prop='maker', label='Seller', width='110')
    el-table-column(prop='buyer', label='Buyer', width='110')
    el-table-column(prop='sell', label='Sell', width='210')
    el-table-column(prop='buy', label='Buy', width='210')

    el-table-column(prop='time', label='Time', width='220')
</template>

<script>
import config from '~/config'

import { mapGetters } from 'vuex'

export default {
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
    fetch() {

      this.rpc.get_table_rows({
        code: config.contract,
        scope: config.contract,
        table: 'results',
        limit: 100
      }).then(r => {
        this.history = r.rows.map(h => {
          let t = new Date(h.time * 1000).toLocaleString().split(':')
          h.time = t[0] + ':' + t[1] + ' ' + t[2].split(' ')[1];

          h.sell = h.sell.quantity + '@' + h.sell.contract;
          h.buy = h.buy.quantity + '@' + h.buy.contract;

          return h
        })
      })
    }
  }
}

</script>
