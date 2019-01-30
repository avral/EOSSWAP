<template lang="pug">
//el-table(:data="history", :prop="{prop: 'block_num', order: 'ascending'}" style='width: 100%')
el-table(:data="history", row-key="block_num'" style='width: 100%')
    el-table-column(prop='block_time', label='Date', width='230')
    el-table-column(prop='action_trace.act.account', label='Token account', width='180')
    el-table-column(prop='action_trace.act.authorization[0].actor', label='Maker')
    el-table-column(prop='action_trace.act.name', label='Operation')
</template>

<script>
import config from '~/config/dev.js'
import { JsonRpc } from 'eosjs'

import { mapGetters } from 'vuex'

// Have history plugin
const rpc = new JsonRpc(process.env.isDev ? 'https://junglehistory.cryptolions.io' : config.host, { fetch });

export default {
  data() {
    return {
      history: [],
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  created() {
    this.fetch()
  },

  methods: {
    fetch() {
      rpc.history_get_actions(config.contract).then(r => {
        this.history = r.actions.filter(h => {
          h.block_time = h.block_time.substr(0, 16).replace('T', ' ')
          
          if (h.action_trace.act.name == "transfer" && h.action_trace.act.data.from != config.contract)
            return true

          if (h.action_trace.act.account != config.contract)
            return false

          return true
        })
      })
    }
  }
}

</script>
