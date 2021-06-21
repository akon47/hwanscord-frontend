import { channels } from './index'

function fetchChannels() {
    return channels.get('/');
}

function createChannel(name) {
    return channels.post('/', { channelName: name });
}

function deleteChannel(channelid) {
    return channels.delete(`/${channelid}`);
}

function modifyChannel(channelid, name) {
    return channels.put(`/${channelid}`, { channelName: name });
}

export { fetchChannels, createChannel, deleteChannel, modifyChannel };