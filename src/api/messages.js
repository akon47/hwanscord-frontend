import { messages } from './index'

function fetchMessages(channelId) {
    return messages.get(`/${channelId}`);
}

function sendMessage(channelId, message) {
    return messages.post('/', { postedBy: channelId, message: message });
}

function deleteMessage(messageId) {
    return messages.delete(`/${messageId}`);
}

function modifyMessage(messageId, message) {
    return messages.put(`/${messageId}`, { message: message });
}

export { fetchMessages, sendMessage, deleteMessage, modifyMessage };