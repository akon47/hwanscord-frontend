<template>
  <div>
    <div
      class="root"
      :class="{ selected: isJoined || isMyChannel }"
      @click.stop="click"
    >
      <span class="header">
        <font-awesome-icon :icon="['fas', 'desktop']" style="color: gray" />
        {{ channelData.user.username }} 님의 화면공유
      </span>
      <!-- <div v-if="isMyChannel">
        <context-menu
          class="context-menu"
          v-model="isMenuOpened"
          :menuItems="menuItems"
        />
        <font-awesome-icon
          class="icon"
          :icon="['fas', 'cog']"
          @click.stop="menuClick"
          v-tooltip="'채널 편집'"
        />
      </div> -->
    </div>
    <div v-for="peer in peers" :key="peer.socketId">
      <voice-channel-user-item :peer="peer" :users="users" v-if="peer.socketId !== channelData.channelId"/>
    </div>
  </div>
</template>

<script>
import VoiceChannelUserItem from "./VoiceChannelUserItem.vue";
import { playVoiceChannelConnectionSound } from "../../audio/index.js";
import { join, getVoiceChannelPeers } from "../../socket/voice";

export default {
  components: {
    VoiceChannelUserItem
  },
  props: {
    channelData: {
      type: Object,
      require: true
    },
    users: {
      type: Array,
      require: true
    }
  },
  data() {
    return {
      peers: []
    };
  },
  computed: {
    isJoined() {
      return (
        this.peers.findIndex(
          elem => elem.socketId === this.$socket.client.id
        ) >= 0
      );
    },
    isMyChannel() {
      return this.channelData.channelId === this.$socket.client.id;
    }
  },
  methods: {
    async click() {
      if (!this.isJoined && !this.$store.getters.isVoiceChannelJoining) {
        this.$store.commit("setJoiningVoiceChannelState", true);
        try {
          playVoiceChannelConnectionSound();
          if (this.$store.getters.getLocalMediaStream === null) {
            await this.$store.dispatch("setupLocalMedia");
          }
          join(this.channelData.channelId);
        } catch (error) {
          console.log(error);
        } finally {
          this.$store.commit("setJoiningVoiceChannelState", false);
        }
      }
    },
  },
  sockets: {
    voiceChannelJoined(data) {
      if (this.channelData.channelId === data.channelId) {
        this.peers.push({ socketId: data.socketId, user: data.user });
      }
      if (this.channelData.channelId === this.$store.getters.joinedVoiceChannel) {
        playVoiceChannelConnectionSound();
      }
    },
    voiceChannelParted(data) {
      if (data.channelId === this.channelData.channelId) {
        const index = this.peers.findIndex(
          elem => elem.socketId === data.socketId
        );
        if (index >= 0) {
          this.peers.splice(index, 1);
        }
      }
    },
    getVoiceChannelPeers(data) {
      if (data.channelId === this.channelData.channelId) {
        this.peers = data.peers.slice();
      }
    }
  },
  created() {
    getVoiceChannelPeers({ channel: this.channelData.channelId });
  }
};
</script>

<style scoped>
.context-menu {
  position: absolute;
  width: 100px;
  right: 30px;
  z-index: 1000;
}

.icon {
  color: #b9bbbe;
  transition: 0.2s;
}
.icon:hover {
  color: #dcddde;
}

.header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.root {
  display: flex;
  position: relative;
  width: calc(100% - 10px);
  padding: 5px;
  margin: 5px;
  background-color: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  line-height: 20px;
  color: darkgray;
  padding-left: 15px;
  justify-content: space-between;
}

.root:hover {
  background-color: rgb(52, 55, 60);
  color: white;
}

.selected {
  background-color: rgb(57, 60, 67);
  color: white;
}

.selected:hover {
  background-color: rgb(57, 60, 67);
}

:focus {
  outline: none;
}
</style>
