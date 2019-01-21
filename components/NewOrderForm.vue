<template lang="pug">
div
  el-button(size="medium" type="primary" @click="visible = true").ml-auto
    span
      slot

  el-dialog(title="Create new order", :visible.sync="visible")
    .leader Token precision must be 4
    h1.leader Sell

    el-input(placeholder="Token contract" v-model="form.sell.contract").mt-2
    el-input(placeholder="Token symbol" v-model="form.sell.symbol").mt-2
    el-input(placeholder="Token amount" v-model="form.sell.amount" type="number" step="0.0001").mt-2

    // TODO Selected with 
    //el-select(v-v-model='form.region', placeholder='Sell token').w-100
      el-option(label='EOS@eosio.token', value='EOS@eosio.token')
        //el-option(label='EOS@eosio.token', value='EOS@eosio.token')

    hr
    h1.leader Buy

    el-input(placeholder="Token contract" v-model="form.buy.contract").mt-2
      //template(slot="prepend") Account
    el-input(placeholder="Token symbol" v-model="form.buy.symbol").mt-2
      //template(slot="prepend") Symbol 
    el-input(placeholder="Token amount"  v-model="form.buy.amount" type="number").mt-2
      //template(slot="prepend") Amount 

    span.dialog-footer(slot='footer')
      //el-button(@click="$emit('close')") Cancel
      el-button(type='primary', @click="submit") Create order
</template>

<script>
import { Api, JsonRpc, RpcError, Serialize } from 'eosjs';

const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });

export default {
  data() {
    return {
      visible: false,

      knownTokenAccounts: [
        'eosio.token',
        'fake'
      ],

      form: {
        sell: {
          symbol: '',
          amount: 0,
          contract: '',
        },

        buy: {
          symbol: '',
          amount: 0,
          contract: '',
        }
      },

      formLabelWidth: '120px'
    }
  },

  created() {
    //this.knownTokenAccounts.map(a => rpc.get_currency_balance()
  },

  methods: {
    submit() {
      // TODO Проверки/валидация

      let form = this.form

      form.sell.amount = parseFloat(form.sell.amount).toFixed(4)
      form.buy.amount = parseFloat(form.buy.amount).toFixed(4)


      let { buy, sell } = form

      let quantity = `${sell.amount} ${sell.symbol}`
      let sell_quantity = `${buy.amount} ${buy.symbol}@${buy.contract}`

      this.$confirm(`Are you sure to sell ${quantity}@${sell.contract} for ${sell_quantity}`, 'Sell', {
        confirmButtonText: 'Sell',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(async () => {
        this.$emit('submit', form)
        this.visible = false
      })
    }
  },
}
</script>
