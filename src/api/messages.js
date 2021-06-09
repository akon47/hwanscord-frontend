import { messages } from './index'

function fetchMessages() {
    return messages.get('/');
}

function sendMessage(message) {
    return messages.post('/', { message: message });
}

export { fetchMessages, sendMessage };