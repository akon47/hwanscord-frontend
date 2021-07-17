import socket from "./index.js"

function createScreenShareChannel() {
    socket.emit('createScreenShareChannel');
}

function getScreenShareChannels() {
    socket.emit('getScreenShareChannels');
}

function relayScreenShareICECandidate(data) {
    socket.emit('relayScreenShareICECandidate', data);
}

function relayScreenShareSessionDescription(data) {
    socket.emit('relayScreenShareSessionDescription', data);
}

export { createScreenShareChannel, getScreenShareChannels, relayScreenShareICECandidate, relayScreenShareSessionDescription };