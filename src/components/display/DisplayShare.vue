<template>
  <div class="h-100">
    <video ref="videoElement" playinline autoplay muted></video>
  </div>
</template>

<script>
import {
  relayScreenShareICECandidate,
  relayScreenShareSessionDescription
} from "../../socket/screen-share";

export default {
  props: {
    screenShareChannels: {
      type: Array,
      require: true
    },
    users: {
      type: Array,
      require: true
    }
  },
  data() {
    return {
      peers: {}
    };
  },
  watch: {
    screenShareChannels() {
      if (this.isHostedScreenShareChannel) {
          this.setPeerVideoElement(this.$store.state.displayMediaStream)
      }
    }
  },
  computed: {
    isHostedScreenShareChannel() {
      return (
        this.screenShareChannels.findIndex(
          elem => elem.channelId === this.$socket.client.id
        ) >= 0
      );
    },
    isScreenShareChannelJoined() {
      return (
        this.screenShareChannels.findIndex(
          elem => elem.channelId === this.$store.getters.joinedVoiceChannel
        ) >= 0
      );
    }
  },
  methods: {
    setPeerVideoElement(stream) {
      const videoElement = this.$refs.videoElement;
      videoElement.srcObject = stream;
    }
  },
  sockets: {
    async addPeer(data) {
      console.log("(DisplayShare) addPeer", data);

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
          console.log("(DisplayShare) onicecandidate", event);
          relayScreenShareICECandidate({
            peerId: peerId,
            iceCandidate: {
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate
            }
          });
        }
      };

      peerConnection.ontrack = event => {
        console.log("(DisplayShare) onTrack", event);
        this.setPeerVideoElement(event.streams[0]);
      };

      if (this.isHostedScreenShareChannel) {
        if (this.$store.getters.getDisplayMediaStream) {
          this.$store.getters.getDisplayMediaStream
            .getTracks()
            .forEach(track =>
              peerConnection.addTrack(
                track,
                this.$store.getters.getDisplayMediaStream
              )
            );
        }

        console.log("(DisplayShare) Creating RTC offer to ", peerId);

        try {
          const localDescription = await peerConnection.createOffer();
          console.log("Local offer description is: ", localDescription);
          await peerConnection.setLocalDescription(localDescription);
          await relayScreenShareSessionDescription({
            peerId: peerId,
            sessionDescription: localDescription
          });
        } catch (error) {
          alert("(DisplayShare) Error sending offer: ", error);
          console.log("(DisplayShare) Error sending offer: ", error);
        }
      }
    },
    removePeer(data) {
      console.log("(DisplayShare) removePeer", data);

      const { peerId } = data;
      if (peerId in this.peers) {
        this.peers[peerId].close();
      }

      delete this.peers[peerId];
    },
    screenShareSessionDescription(data) {
      console.log("screenShareSessionDescription", data);

      const { peerId, sessionDescription } = data;
      const peer = this.peers[peerId];

      var desc = new RTCSessionDescription(sessionDescription);
      const stuff = peer.setRemoteDescription(
        desc,
        () => {
          console.log("(DisplayShare) setRemoteDescription succeeded");
          if (sessionDescription.type == "offer") {
            console.log("(DisplayShare) Creating answer");
            peer.createAnswer(
              localDescription => {
                console.log(
                  "(DisplayShare) Answer description is: ",
                  localDescription
                );
                peer.setLocalDescription(
                  localDescription,
                  () => {
                    relayScreenShareSessionDescription({
                      peerId: peerId,
                      sessionDescription: localDescription
                    });
                    console.log(
                      "(DisplayShare) Answer setLocalDescription succeeded"
                    );
                  },
                  () => {
                    alert("(DisplayShare) Answer setLocalDescription failed!");
                  }
                );
              },
              error => {
                console.log("(DisplayShare) Error creating answer: ", error);
                console.log(peer);
              }
            );
          }
        },
        error => {
          console.log("(DisplayShare) setRemoteDescription error: ", error);
        }
      );
      console.log("(DisplayShare) setRemoteDescription", stuff);
    },
    screenShareIceCandidate(data) {
      console.log("(DisplayShare) screenShareIceCandidate", data);

      const { peerId, iceCandidate } = data;
      const peer = this.peers[peerId];
      peer.addIceCandidate(new RTCIceCandidate(iceCandidate));
    }
  }
};
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
}
</style>
