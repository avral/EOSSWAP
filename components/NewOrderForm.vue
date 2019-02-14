<template lang="pug">
div
  el-button(size="medium" type="primary" @click="open").ml-auto
    span
      slot

  el-dialog(v-if="user" title="Create new order", :visible.sync="visible" width="50%")
    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      h1.leader Sell

      el-form-item(label="Sell token")
        el-select(v-model="tokenSelect", placeholder='Sell token' @change="sellSellToken").w-100
          el-option(v-for="b in user.balances" :key="b.currency + '@' + b.contract" :label="b.currency + '@' + b.contract",
          :value="b.currency + '@' + b.contract")

      el-form-item(v-if="tokenSelect" label="Token amount")
        el-input(placeholder="0.0001" v-model="form.sell.amount" type="number" step="0.0001" @change="parseAmounts")

      div(v-if="form.sell.amount")
        hr

        h1.leader Buy

        el-tabs
          el-tab-pane(label="Auto select")
            el-select(v-model='sellSelect', filterable placeholder='Select' clearable @change="setBuyToken").w-100
              el-option(
                v-for="t in tokens",
                :key="t.symbol + '@' + t.contract",
                :label="t.symbol + '@' + t.contract",
                :value="t.symbol + '@' + t.contract"
              )

          el-tab-pane(label="Manually")
            el-form-item(label="Token contract" prop="buy.contract")
              el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.buy.contract")

            el-form-item(v-if="form.buy.contract" label="Token symbol" prop="buy.symbol")
              // TODO Uppercase
              el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.buy.symbol").upperinput

        el-form-item(v-if="form.buy.symbol" label="Token amount")
          el-input(placeholder="0.0001"  v-model="form.buy.amount" type="number" @change="parseAmounts").mt-2

        span.dialog-footer
          el-button(type='primary' v-if="form.buy.amount != 'NaN'" @click="submit").mt-3.w-100 Create order
</template>

<script>
import config from '~/config'

import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      visible: false,

      tokens: [],
      sellSelect: '',

      form: {
        sell: {
          symbol: '',
          amount: null,
          contract: '',
        },

        buy: {
          symbol: '',
          amount: null,
          contract: '',
        }
      },

      rules: {
        "buy.contract": {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            try {
              await this.rpc.get_account(value)
              callback()
            } catch (e) {
              callback(new Error('Account not exists'))
            }
          },
        },

        "buy.symbol": {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            let r = await this.rpc.get_currency_stats(this.form.buy.contract, value)

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
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc'])
  },

  created() {
    this.fetchTokens()
  },

  methods: {
    sellSellToken(a) {
      this.form.sell.symbol = a.split('@')[0]
      this.form.sell.contract = a.split('@')[1]
    },

    setBuyToken(a) {
      this.form.buy.symbol = a.split('@')[0]
      this.form.buy.contract = a.split('@')[1]
    },

    open() {
      if (this.user)
        this.visible = true
      else
        this.$notify({ title: 'Login', message: 'Pleace login first', type: 'info' })
    },

    fetchTokens() {
      // TODO Refactor, bar code here
      let efSocket = new WebSocket('wss://api-v1.eosflare.io/socket.io/?EIO=3&transport=websocket')

      efSocket.addEventListener('open', event => {
        efSocket.addEventListener('message', event => {
          let code = event.data.substr(0, 2)

          if (code == 42) {
            this.tokens = JSON.parse(JSON.parse(event.data.substr(2))[1]).tokens
          }
        })

        efSocket.send('42["message", {"_url":"/chain/get_tokens","_method":"POST","_headers":{"content-type":"application/json"},"page":0,"limit":500,"lang":"en-US"}]')
      })
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
.el-form {
  padding: 10px 70px;
}

.upperinput {
    text-transform: uppercase;
}
.upperinput:placeholder-shown {
    text-transform: none;
}
</style>
