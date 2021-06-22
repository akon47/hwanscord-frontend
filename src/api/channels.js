import { channels } from './index'

function fetchChannels() {
    return channels.get('/');
}

function createChannel(name) {
    return channels.post('/', { channelName: name });
}

function deleteChannel(channelId) {
    return channels.delete(`/${channelId}`);
}

function modifyChannel(channelId, name) {
    return channels.put(`/${channelId}`, { channelName: name });
}

export { fetchChannels, createChannel, deleteChannel, modifyChannel };