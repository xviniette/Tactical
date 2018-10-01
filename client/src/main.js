import Vue from 'vue'
import App from './App.vue'
import store from './store'

import mixin from "./components/mixin.js"

Vue.config.productionTip = false

Vue.mixin(mixin);

new Vue({
  mixins: [mixin],
  store,
  render: h => h(App)
}).$mount('#app')