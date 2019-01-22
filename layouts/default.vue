<template lang="pug">
.container
  .row
    .col-lg-9.m-auto
      nuxt

  footer
    .row
      .col.d-flex
        span.ml-auto Created by
          b  
            a(href="https://github.com/avral" target="_blank")  #Avral
</template>

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
