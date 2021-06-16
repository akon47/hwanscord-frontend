import { messages } from './index'

function fetchMessages() {
    return messages.get('/');
}

function sendMessage(message) {
    return messages.post('/', { message: message });
}

function deleteMessage(messageid) {
    return messages.delete(`/${messageid}`);
}

function modifyMessage(messageid, message) {
    return messages.put(`/${messageid}`, { message: message });
}

export { fetchMessages, sendMessage, deleteMessage, modifyMessage };