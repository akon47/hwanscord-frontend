<template>
  <div ref="root"></div>
</template>

<script>
import { relayICECandidate, relaySessionDescription } from "../../socket/voice";

export default {
  data() {
    return {
      localMediaStream: null,
      peers: {},
      peerMediaElements: {},
    };
  },
  methods: {
    setupLocalMedia() {
      navigator.getUserMedia(
        { audio: true, video: false },
        (stream) => {
          console.log("Access granted to audio");
          this.localMediaStream = stream;
        },
        () => {
          console.log("Access denied for audio");
          alert(
            "You chose not to provide access to the microphone, voice chat will not work."
          );
        }
      );
    },
    addPeerAudioElement(stream) {
      const root = this.$refs.root;
      let peerAudioElement = new Audio();
      peerAudioElement.autoplay = true;
      peerAudioElement.muted = false;
      peerAudioElement.controls = true;
      peerAudioElement.srcObject = stream;
      root.appendChild(peerAudioElement);
      return peerAudioElement;
    },
  },
  sockets: {
    addPeer(data) {
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
        this.peerMediaElements[peerId] = this.addPeerAudioElement(
          event.stream
        );
      };

      peerConnection.addStream(this.localMediaStream);

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
  },
  mounted() {
    const supported = "getUserMedia" in navigator;
    this.$store.commit("setVoiceChatSupported", supported);
    if (!supported) {
      console.error("Unfortunately we can't get access to your mic");
    } else {
      this.setupLocalMedia();
    }
  },
};
</script>

<style>
</style>