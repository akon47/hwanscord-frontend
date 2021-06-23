import socket from "./index.js"

function join(channelId, data) {
    socket.emit('joinVoiceChannel', { channel: channelId, userdata: data });
}

function part(channelId) {
    socket.emit('partVoiceChannel', channelId);
}

function relayICECandidate(data) {
    socket.emit('relayICECandidate', data);
}

function relaySessionDescription(data) {
    socket.emit('relaySessionDescription', data);
}

export { join, part, relayICECandidate, relaySessionDescription };