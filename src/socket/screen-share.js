import socket from "./index.js"

function host() {
    socket.emit('hostScreenShareChannel');
}

function join(channelId, data) {
    socket.emit('joinScreenShareChannel', { channel: channelId, userdata: data });
}

function part(channelId) {
    socket.emit('partScreenShareChannel', channelId);
}

export { host, join, part };