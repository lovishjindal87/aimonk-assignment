import { createApp } from 'vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './toast.css'
import App from './App.vue'
import './App.css'

createApp(App)
  .use(Toast, {
    position: POSITION.BOTTOM_RIGHT,
    transition: 'Vue-Toastification__fade',
    timeout: 2600,
    maxToasts: 4,
    pauseOnHover: true,
    closeOnClick: true,
    showCloseButtonOnHover: true,
    hideProgressBar: true,
    draggable: false,
    newestOnTop: true,
  })
  .mount('#app')
