<template lang="pug">
.container
  .row
    .col-lg-9.m-auto
      .display-4
        nuxt-link(tag="span" :to="{name: 'index'}" style="cursor: pointer;") EOS Swap: 
        | token exchanger

      el-alert(title="Scatter in not connected:" :closable="false" show-icon type="info" v-if="!$store.state.chain.scatterConnected").mt-2
        span.ml-1 Unlock or install  
        a(href="https://get-scatter.com/" target="_blank") Scatter
        i(@click="scatterConnect" size="mini").el-alert__closebtn Update

      el-alert(title="Node is not connected:" :closable="false"  show-icon type="error" v-if="netError").mt-2
        span.ml-1 Network is unreacheble pleace check your internet connection.

      nuxt

  footer
    .row
      .col.d-flex
        span.ml-auto Created by
          b  
            a(href="https://github.com/avral" target="_blank")  #Avral
</template>

<script>
import axios from 'axios'

import config from '~/config'

export default {
  data() {
    return {
      netError: false
    }
  },

  async created() {
    try {
      await this.$store.getters['chain/rpc'].get_info()
    } catch(e) {
      this.netError = true
      console.log('Net error', e)
    }
  },

  methods: {
    async scatterConnect() {
      try {
        await this.$store.dispatch('chain/scatterConnect')

        if(this.$store.state.chain.scatterConnected)
          this.$notify({ title: 'Scatter', message: 'Scatter connected', type: 'success' })
          
      } catch(e) {
        this.$notify({ title: 'Scatter error', message: e.message, type: 'error' })
      }
    }
  }
}
</script>

<style>
.container {
  margin-top: 100px;
}

footer {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    padding-right: 5px;
}
</style>
