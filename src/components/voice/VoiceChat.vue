<template>
  <div style="height: 100%">
    <div ref="voiceElements"></div>
    <div class="voice-container">
      <span>
        <span>
          <div id="connection">
            <font-awesome-icon :icon="['fas', 'signal']" /> 음성 연결됨
          </div>
          <div id="channel">{{ joinedVoiceChannel }}</div>
        </span>
      </span>
      <span>
        <div class="icon" @click.stop="partVoiceChannel">
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
  part,
} from "../../socket/voice";

export default {
  props: {
    voiceChannels: {
      type: Array,
      require: true,
    },
  },
  data() {
    return {
      localMediaStream: null,
      peers: {},
      peerMediaElements: {},
    };
  },
  methods: {
    async setupLocalMedia() {
      if (this.localMediaStream === null || !this.localMediaStream.active) {
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          console.log("Access granted to audio");
          this.localMediaStream = stream;
        } catch (error) {
          console.log("Access denied for audio", error);
          alert(
            "You chose not to provide access to the microphone, voice chat will not work."
          );
        }
      }
    },
    async closeLocalMedia() {
      if (this.localMediaStream !== null) {
        this.localMediaStream.getTracks().forEach((track) => {
          track.stop();
        });
        this.localMediaStream = null;
      }
    },
    partVoiceChannel() {
      part();
    },
    addPeerAudioElement(stream) {
      const voiceElements = this.$refs.voiceElements;
      let peerAudioElement = new Audio();
      peerAudioElement.autoplay = true;
      peerAudioElement.muted = false;
      peerAudioElement.controls = true;
      peerAudioElement.srcObject = stream;
      voiceElements.appendChild(peerAudioElement);
      return peerAudioElement;
    },
  },
  sockets: {
    async addPeer(data) {
      console.log("addPeer", data);

      const { peerId } = data;
      if (peerId in this.peers) {
        return;
      }

      let peerConnection = new RTCPeerConnection(
        { iceServers: [{ url: "stun:stun.l.google.com:19302" }] },
        { optional: [{ DtlsSrtpKeyAgreement: true }] }
      );
      this.peers[peerId] = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          relayICECandidate({
            peerId: peerId,
            iceCandidate: {
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate,
            },
          });
        }
      };

      peerConnection.onaddstream = (event) => {
        console.log("onAddStream", event);
        this.peerMediaElements[peerId] = this.addPeerAudioElement(event.stream);
      };

      if (this.localMediaStream === null) {
        await this.setupLocalMedia();
      }

      if (this.localMediaStream !== null) {
        peerConnection.addStream(this.localMediaStream);
      }

      if (data.shouldCreateOffer) {
        console.log("Creating RTC offer to ", peerId);
        peerConnection.createOffer(
          (localDescription) => {
            console.log("Local offer description is: ", localDescription);
            peerConnection.setLocalDescription(
              localDescription,
              () => {
                relaySessionDescription({
                  peerId: peerId,
                  sessionDescription: localDescription,
                });
                console.log("Offer setLocalDescription succeeded");
              },
              () => {
                alert("Offer setLocalDescription failed!");
              }
            );
          },
          (error) => {
            console.log("Error sending offer: ", error);
          }
        );
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
      peer.setRemoteDescription(
        desc,
        () => {
          console.log("setRemoteDescription succeeded");
          if (sessionDescription.type == "offer") {
            console.log("Creating answer");
            peer.createAnswer(
              (localDescription) => {
                console.log("Answer description is: ", localDescription);
                peer.setLocalDescription(
                  localDescription,
                  () => {
                    relaySessionDescription({
                      peerId: peerId,
                      sessionDescription: localDescription,
                    });
                    console.log("Answer setLocalDescription succeeded");
                  },
                  () => {
                    alert("Answer setLocalDescription failed!");
                  }
                );
              },
              (error) => {
                console.log("Error creating answer: ", error);
                console.log(peer);
              }
            );
          }
        },
        (error) => {
          console.log("setRemoteDescription error: ", error);
        }
      );
    },
    iceCandidate(data) {
      console.log("iceCandidate", data);

      const peer = this.peers[data.peerId];
      const iceCandidate = data.iceCandidate;
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
        await this.setupLocalMedia();
        this.$store.commit("setJoinedVoiceChannel", data.channelId);
      }
    },
    async voiceChannelParted(data) {
      if (data.socketId === this.$socket.client.id) {
        this.$store.commit("clearJoinedVoiceChannel");
        await this.closeLocalMedia();
      }
    },
    voiceChannelDeleted(data) {
      if (data._id === this.$store.getters.joinedVoiceChannel) {
        this.partVoiceChannel();
      }
    },
  },
  computed: {
    joinedVoiceChannel() {
      const channel = this.voiceChannels.find(
        (elem) => elem._id === this.$store.getters.joinedVoiceChannel
      );
      if (channel) {
        return channel.channelName;
      } else {
        return "";
      }
    },
  },
  async mounted() {
    const supported = "getUserMedia" in navigator;
    this.$store.commit("setVoiceChatSupported", supported);
    if (!supported) {
      console.error("Unfortunately we can't get access to your mic");
    } else {
      //await this.setupLocalMedia();
    }
  },
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
</style>