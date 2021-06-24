<template>
  <div class="channel-list">
    <div class="channel-type">
      <span>채팅채널</span>
      <div class="icon" @click="addChannel" v-tooltip="'채널 만들기'" >
        <font-awesome-icon :icon="['fas', 'plus']" />
      </div>
    </div>
    <channel-list-item
      v-for="channel in channels"
      :key="channel._id"
      :channelData="channel"
      :channelId="channelId"
    ></channel-list-item>
    <div class="channel-type">
      <span>음성채널</span>
      <div class="icon" @click="addVoiceChannel" v-tooltip="'채널 만들기'">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </div>
    </div>
    <voice-channel-list-item
      v-for="voiceChannel in voiceChannels"
      :key="voiceChannel._id"
      :channelData="voiceChannel"
      :users="users"
    >
    </voice-channel-list-item>
  </div>
</template>

<script>
import ChannelListItem from "./ChannelListItem.vue";
import { createChannel } from "../../api/channels";
import { createVoiceChannel } from "../../api/voiceChannels";
import VoiceChannelListItem from "./VoiceChannelListItem.vue";

export default {
  components: {
    ChannelListItem,
    VoiceChannelListItem
  },
  props: {
    channelId: {
      type: String
    },
    channels: {
      type: Array,
      require: true
    },
    voiceChannels: {
      type: Array,
      require: true
    },
    users: {
      type: Array,
      require: true
    }
  },
  methods: {
    async addChannel() {
      const channelName = prompt("채널 생성");
      if (channelName) {
        await createChannel(channelName);
      }
    },
    async addVoiceChannel() {
      const channelName = prompt("채널 생성");
      if (channelName) {
        await createVoiceChannel(channelName);
      }
    }
  }
};
</script>

<style scoped>
.icon {
  color: #b9bbbe;
  font-size: 12pt;
  transition: 0.2s;
}
.icon:hover {
  color: #dcddde;
}

.channel-type {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  color: #cccccc;
  font-size: 10pt;
  font-weight: bold;
  margin: 10px;
}
.channel-list {
  height: 100%;
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
