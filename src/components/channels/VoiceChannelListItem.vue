<template>
  <div>
    <div class="root" :class="{ selected: isJoined }" @click.stop="click">
      <span class="header">
        <font-awesome-icon :icon="['fas', 'volume-up']" style="color: gray" />
        {{ channelData.channelName }}
      </span>
      <div v-if="isMyChannel">
        <context-menu
          class="context-menu"
          v-model="isMenuOpened"
          :menuItems="menuItems"
        />
        <font-awesome-icon
          class="icon"
          :icon="['fas', 'cog']"
          @click.stop="menuClick"
        />
      </div>
    </div>
    <div v-for="peer in peers" :key="peer.socketId">
      <voice-channel-user-item :peer="peer" :users="users" />
    </div>
  </div>
</template>

<script>
import ContextMenu from "../common/ContextMenu.vue";
import {
  modifyVoiceChannel,
  deleteVoiceChannel,
} from "../../api/voiceChannels";
import { join, getVoiceChannelPeers } from "../../socket/voice";
import VoiceChannelUserItem from "./VoiceChannelUserItem.vue";

export default {
  components: {
    ContextMenu,
    VoiceChannelUserItem,
  },
  props: {
    channelData: {
      type: Object,
      require: true,
    },
    users: {
      type: Array,
      require: true,
    },
  },
  data() {
    return {
      isMenuOpened: false,
      menuItems: [
        { header: "수정", callback: () => this.modify() },
        { header: "삭제", callback: () => this.delete() },
      ],
      peers: [],
    };
  },
  methods: {
    click() {
      if (!this.isJoined) {
        join(this.channelData._id);
      }
    },
    menuClick() {
      this.isMenuOpened = true;
    },
    async modify() {
      const channelName = prompt(
        "채널 이름 수정",
        this.channelData.channelName
      );
      if (channelName) {
        await modifyVoiceChannel(this.channelData._id, channelName);
      }
    },
    async delete() {
      await deleteVoiceChannel(this.channelData._id);
    },
  },
  computed: {
    isMyChannel() {
      return this.channelData.createdBy.username === this.$store.state.username;
    },
    isJoined() {
      return (
        this.peers.findIndex(
          (elem) => elem.socketId === this.$socket.client.id
        ) >= 0
      );
    },
  },
  sockets: {
    voiceChannelJoined(data) {
      if (data.channelId === this.channelData._id) {
        this.peers.push({ socketId: data.socketId, user: data.user });
      }
    },
    voiceChannelParted(data) {
      if (data.channelId === this.channelData._id) {
        const index = this.peers.findIndex(
          (elem) => elem.socketId === data.socketId
        );
        if (index >= 0) {
          this.peers.splice(index, 1);
        }
      }
    },
    getVoiceChannelPeers(data) {
      if (data.channelId === this.channelData._id) {
        this.peers = data.peers.slice();
      }
    },
  },
  created() {
    getVoiceChannelPeers({ channel: this.channelData._id });
  },
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
</style>
