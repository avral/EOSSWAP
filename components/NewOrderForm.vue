<template lang="pug">
div
  el-button(size="medium" type="primary" @click="open").ml-auto
    span
      slot

  el-dialog(v-if="user" title="Create new order", :visible.sync="visible" width="50%")
    el-form(ref="form" :model="form" label-width="120px" width="50%" :rules="rules")
      h1.leader Sell

      el-form-item(label="Sell token")
        el-select(v-model="tokenSelect", placeholder='Sell token' @change="sellChange").w-100
          el-option(v-for="b in user.balances" :key="b.currency + '@' + b.contract" :label="b.currency + '@' + b.contract",
          :value="b.currency + '@' + b.contract")

      el-form-item(v-if="tokenSelect" label="Token amount")
        el-input(placeholder="0.0001" v-model="form.sell.amount" type="number" step="0.0001" @change="parseAmounts")

      //div(v-if="form.sell.amount")
      div
        hr

        h1.leader Buy

        //el-form-item(v-if="form.sell.amount" label="Token contract" prop="buyContract")
        el-form-item(label="Token contract" prop="buy.contract")
          el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.buy.contract")

        el-form-item(v-if="form.buy.contract" label="Token symbol" prop="buy.symbol")
          // TODO Uppercase
          el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.buy.symbol").upperinput

        el-form-item(v-if="form.buy.symbol" label="Token amount")
          el-input(placeholder="0.0001"  v-model="form.buy.amount" type="number" @change="parseAmounts").mt-2

        //span.dialog-footer
          //el-button(@click="$emit('close')") Cancel
          el-button(type='primary', @click="submit") Create order
</template>

<script>
import config from '~/config/dev.js'
import { JsonRpc } from 'eosjs'

const rpc = new JsonRpc(config.host, { fetch });

import { mapGetters } from 'vuex'

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

      rules: {
        "buy.contract": {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            try {
              await rpc.get_account(value)
              callback()
            } catch (e) {
              callback(new Error('Account not exists'))
            }
          },
        },

        "buy.symbol": {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            let r = await rpc.get_currency_stats(this.form.buy.contract, value)

            if (value in r)
              callback()
            else
              callback(new Error(`No ${value} symbol in ${this.form.buy.contract} contract`))
          },
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
    open() {
      if (this.user)
        this.visible = true
      else
        this.$notify({ title: 'Login', message: 'Pleace login first', type: 'info' })
    },

    sellChange(a) {
      this.form.sell.symbol = a.split('@')[0]
      this.form.sell.contract = a.split('@')[1]
    },

    parseAmounts() {
      this.form.sell.amount = parseFloat(this.form.sell.amount).toFixed(4)
      this.form.buy.amount = parseFloat(this.form.buy.amount).toFixed(4)
    },

    submit() {
      // TODO Проверки/валидация

      let form = this.form

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

<style>
.el-dialog__body {
  padding: 10px 70px;
}

.upperinput {
    text-transform: uppercase;
}
.upperinput:placeholder-shown {
    text-transform: none;
}
</style>
