import axios from 'axios'

const instance = axios.create({
    baseURL: 'https://kimhwan.kr/hwanscord-backend/api'
});

function registerUser(userData) {
    return instance.post('/registerUser', userData);
}

export { registerUser }