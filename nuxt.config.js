const pkg = require('./package')

const isSPA = process.argv.includes('--spa')
const isDev = process.env.npm_lifecycle_event == 'dev'
const isMainnet = process.argv.includes('--mainnet')

module.exports = {
  mode: 'spa',

  env: {
    isDev,
    isMainnet,
  },

  /*
  ** Headers of the page
  */
  head: {
    title: pkg.name,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: pkg.description }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
    'element-ui/lib/theme-chalk/index.css',
    'bootstrap-utilities/bootstrap-utilities.css',
    'bootstrap/dist/css/bootstrap.min.css'
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  '@/plugins/element-ui',

  {ssr: false, src: '~/plugins/startapp.js'},
],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    '@nuxtjs/axios'
  ],
  /*
  ** Axios module configuration
  */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }

      if (isSPA) {
        config.output.publicPath = './_nuxt/'
      }
    }
  },

  router: {
    mode: isSPA ? 'hash' : 'history',
    linkActiveClass: 'active',
  },
}
