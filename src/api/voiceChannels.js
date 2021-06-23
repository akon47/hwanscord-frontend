import { voiceChannels } from './index'

function fetchVoiceChannels() {
    return voiceChannels.get('/');
}

function createVoiceChannel(name) {
    return voiceChannels.post('/', { channelName: name });
}

function deleteVoiceChannel(channelId) {
    return voiceChannels.delete(`/${channelId}`);
}

function modifyVoiceChannel(channelId, name) {
    return voiceChannels.put(`/${channelId}`, { channelName: name });
}

export { fetchVoiceChannels, createVoiceChannel, deleteVoiceChannel, modifyVoiceChannel };