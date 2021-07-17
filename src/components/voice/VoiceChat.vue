<template>
  <div style="height: 100%">
    <div class="audio-elements" ref="voiceElements"></div>
    <div class="voice-container">
      <span>
        <span>
          <div
            v-if="!isLoading && !$store.getters.isVoiceChannelJoining"
            id="connection"
          >
            <font-awesome-icon :icon="['fas', 'signal']" /> 음성 연결됨
          </div>
          <div v-else id="loading-message">
            연결을 기다리는 중
          </div>
          <div id="channel">{{ joinedVoiceChannel }}</div>
        </span>
      </span>
      <span>
        <div
          class="icon"
          @click.stop="partVoiceChannel"
          v-tooltip="'연결 끊기'"
          v-if="!isLoading"
        >
          <font-awesome-icon :icon="['fas', 'phone-slash']" />
        </div>
      </span>
    </div>
  </div>
</template>

<script>
import {
  relayICECandidate,
  relaySessionDescription,
  part
} from "../../socket/voice";
import { playVoiceChannelDisconnectionSound } from "../../audio/index.js";

export default {
  props: {
    voiceChannels: {
      type: Array,
      require: true
    }
  },
  data() {
    return {
      peers: {},
      peerMediaElements: {},
      isLoading: false
    };
  },
  methods: {
    partVoiceChannel() {
      part();
    },
    addPeerAudioElement(stream) {
      const voiceElements = this.$refs.voiceElements;
      let peerAudioElement = new Audio();
      peerAudioElement.autoplay = true;
      peerAudioElement.muted = false;
      peerAudioElement.controls = false;
      peerAudioElement.srcObject = stream;
      voiceElements.appendChild(peerAudioElement);
      return peerAudioElement;
    }
  },
  sockets: {
    async addPeer(data) {
      console.log("addPeer", data);

      const { peerId } = data;
      if (peerId in this.peers) {
        return;
      }

      let peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302"
          },
          {
            urls: "turn:kimhwan.kr:3478?transport=tcp",
            credential: "turn",
            username: "turn"
          }
        ]
      });

      this.peers[peerId] = peerConnection;

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          console.log("onicecandidate", event);
          relayICECandidate({
            peerId: peerId,
            iceCandidate: {
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate
            }
          });
        }
      };

      peerConnection.ontrack = event => {
        console.log("onTrack", event);
        this.peerMediaElements[peerId] = this.addPeerAudioElement(event.streams[0]);
      };

      if (this.$store.getters.getLocalMediaStream) {
        //peerConnection.addStream(this.localMediaStream); // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream
        this.$store.getters.getLocalMediaStream
          .getTracks()
          .forEach(track =>
            peerConnection.addTrack(
              track,
              this.$store.getters.getLocalMediaStream
            )
          );
      }

      if (data.shouldCreateOffer) {
        console.log("Creating RTC offer to ", peerId);

        try {
          const localDescription = await peerConnection.createOffer();
          console.log("Local offer description is: ", localDescription);
          await peerConnection.setLocalDescription(localDescription);
          await relaySessionDescription({
            peerId: peerId,
            sessionDescription: localDescription
          });
        } catch (error) {
          alert("Error sending offer: ", error);
          console.log("Error sending offer: ", error);
        }
      }
    },
    removePeer(data) {
      console.log("removePeer", data);

      const { peerId } = data;
      if (peerId in this.peerMediaElements) {
        this.peerMediaElements[peerId].remove();
      }
      if (peerId in this.peers) {
        this.peers[peerId].close();
      }

      delete this.peers[peerId];
      delete this.peerMediaElements[peerId];
    },
    sessionDescription(data) {
      console.log("sessionDescription", data);

      const { peerId, sessionDescription } = data;
      const peer = this.peers[peerId];

      var desc = new RTCSessionDescription(sessionDescription);
      const stuff = peer.setRemoteDescription(
        desc,
        () => {
          console.log("setRemoteDescription succeeded");
          if (sessionDescription.type == "offer") {
            console.log("Creating answer");
            peer.createAnswer(
              localDescription => {
                console.log("Answer description is: ", localDescription);
                peer.setLocalDescription(
                  localDescription,
                  () => {
                    relaySessionDescription({
                      peerId: peerId,
                      sessionDescription: localDescription
                    });
                    console.log("Answer setLocalDescription succeeded");
                  },
                  () => {
                    alert("Answer setLocalDescription failed!");
                  }
                );
              },
              error => {
                console.log("Error creating answer: ", error);
                console.log(peer);
              }
            );
          }
        },
        error => {
          console.log("setRemoteDescription error: ", error);
        }
      );
      console.log("setRemoteDescription", stuff);
    },
    iceCandidate(data) {
      console.log("iceCandidate", data);

      const { peerId, iceCandidate } = data;
      const peer = this.peers[peerId];
      peer.addIceCandidate(new RTCIceCandidate(iceCandidate));
    },
    disconnect() {
      for (const peerId in this.peerMediaElements) {
        this.peerMediaElements[peerId].remove();
      }
      for (const peerId in this.peers) {
        this.peers[peerId].close();
      }

      this.peers = {};
      this.peerMediaElements = {};
    },
    async voiceChannelJoined(data) {
      if (data.socketId === this.$socket.client.id) {
        try {
          this.isLoading = true;
          this.$store.commit("setJoinedVoiceChannel", data.channelId);
        } catch (error) {
          console.log(error);
        } finally {
          this.isLoading = false;
        }
      }
    },
    async voiceChannelParted(data) {
      if (data.socketId === this.$socket.client.id) {
        this.$store.commit("clearJoinedVoiceChannel");
        this.$store.dispatch("closeLocalMedia");
        playVoiceChannelDisconnectionSound();
      }
    },
    voiceChannelDeleted(data) {
      if (data._id === this.$store.getters.joinedVoiceChannel) {
        this.partVoiceChannel();
      }
    }
  },
  computed: {
    joinedVoiceChannel() {
      const channel = this.voiceChannels.find(
        elem => elem._id === this.$store.getters.joinedVoiceChannel
      );
      if (channel) {
        return channel.channelName;
      } else {
        return "";
      }
    }
  },
  async mounted() {
    const supported = "mediaDevices" in navigator;
    this.$store.commit("setVoiceChatSupported", supported);
    if (!supported) {
      alert("Unfortunately we can't get access to your mic");
      console.error("Unfortunately we can't get access to your mic");
    }
  }
};
</script>

<style scoped>
.voice-container {
  display: flex;
  justify-content: space-between;
  align-content: center;
  align-items: center;
  height: 100%;
  font-size: 14px;
  font-weight: bold;
  padding: 0px 10px;
}

.voice-container #connection {
  color: #4fdc7c;
}

.voice-container #loading-message {
  color: rgb(250, 168, 26);
}

.voice-container #channel {
  color: #b9bbbe;
}

.icon {
  color: #b9bbbe;
  font-size: 14px;
  transition: 0.2s;
  border-radius: 5px;
  padding: 6px;
}
.icon:hover {
  color: #dcddde;
  background-color: rgb(51, 54, 59);
}

.audio-elements audio {
  display: none;
}
</style>
