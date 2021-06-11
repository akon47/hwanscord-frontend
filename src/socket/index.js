import store from '../store/index'
import VueSocketIO from 'vue-socket.io'

const socketUrl = 'https://kimhwan.kr/';

export default new VueSocketIO({
    debug: true,
    connection: socketUrl,
    vuex: {
        store,
        actionPrefix: 'SOCKET_',
        mutationPrefix: 'SOCKET_'
    },
    options: { path: "/hwanscord-backend/socket.io/" }
});