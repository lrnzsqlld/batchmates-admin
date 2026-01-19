import axios from 'axios'

declare global {
    interface Window {
        axios: typeof axios
    }
}

window.axios = axios

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['Content-Type'] = 'application/json'