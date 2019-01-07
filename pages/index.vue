<template lang="pug">
div
  .display-4 Orderbook: eosio.token exchanger

  el-tabs(type='border-card').mt-3
    el-tab-pane(label='Orders')
      .row
        .col.d-flex
          el-button(size="small" type="success").ml-auto Create order

      .row
        .col
          el-table(:data="orders")
            el-table-column(label="Order id" width="100")
              template(slot-scope='scope')
                //i.el-icon-time
                span(style='margin-left: 10px') {{ scope.row.id }}

            el-table-column(label="Owner")
              template(slot-scope='scope')
                .name-wrapper(slot='reference')
                  el-tag(size='medium') {{ scope.row.maker }}

            el-table-column(label="Sell / Buy")
              template(slot-scope="scope")
                span {{ scope.row.sell }} / {{ scope.row.buy }}

            el-table-column(label='Operations')
              template(slot-scope='scope')
                el-button(size='mini', type="primary" @click='handleEdit(scope.$index, scope.row)') Buy

    el-tab-pane(label='My orders')
      h1 lol
    el-tab-pane(label='History')
      el-table(:data="history", style='width: 100%')
        el-table-column(prop='block_time', label='Date', width='230')
        el-table-column(prop='action_trace.act.account', label='Actor', width='180')
        el-table-column(prop='action_trace.act.authorization[0].actor', label='Maker')
        el-table-column(prop='action_trace.act.name', label='Operation')
    el-tab-pane(label='Settings')


</template>

<script>
import { Api, JsonRpc, RpcError } from 'eosjs';

// FIXME Only for dev
//import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';

const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
//const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const api = new Api({ rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

export default {
  data() {
    return {
      orders: [],
      history: [],
    }
  },

  created() {
    this.fetch()
  },

  methods: {
    async fetch() {
      rpc.get_table_rows({code: 'ordersbook', scope: 'ordersbook', table: 'orders'}).then(r => this.orders = r.rows)

      rpc.history_get_actions('ordersbook').then(r => {
        console.log(r.actions)
        this.history = r.actions.filter(h => !(['setcode', 'setabi'].includes(h.action_trace.act.name)))
      })
    }
  }
}
</script>
