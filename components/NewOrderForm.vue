<template lang="pug">
div
  el-button(size="medium" type="primary" @click="visible = true").ml-auto
    span
      slot

  el-dialog(title="Create new order", :visible.sync="visible")
    .leader Token precision must be 4
    h1.leader Sell

    el-select(v-if="user" v-model="tokenSelect", placeholder='Sell token' @change="sellChange").w-100
      el-option(v-for="b in user.balances" :key="b.currency + '@' + b.contract" :label="b.currency + '@' + b.contract",
      :value="b.currency + '@' + b.contract")

    el-input(placeholder="Token amount" v-model="form.sell.amount" type="number" step="0.0001").mt-2

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
import { mapGetters } from 'vuex'

import { Api, JsonRpc, RpcError, Serialize } from 'eosjs';

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

      formLabelWidth: '120px',
      tokenSelect: ''
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  created() {
    //this.knownTokenAccounts.map(a => rpc.get_currency_balance()
  },

  methods: {
    sellChange(a) {
      this.form.sell.symbol = a.split('@')[0]
      this.form.sell.contract = a.split('@')[1]
    },

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
      }).catch(() => {
      })
    }
  },
}
</script>
