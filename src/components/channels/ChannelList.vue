<template>
  <div class="channel-list">
    <div class="channel-type">
      <span>채팅채널</span>
      <div class="icon" @click="addChannel" v-tooltip="'채널 만들기'">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </div>
    </div>
    <message-channel-list-item
      v-for="channel in channels"
      :key="channel._id"
      :channelData="channel"
      :channelId="channelId"
    ></message-channel-list-item>
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
    <div class="channel-type">
      <span>화면공유채널</span>
      <div
        class="icon"
        @click="addScreenShareChannel"
        v-tooltip="'내 화면 공유하기'"
      >
        <font-awesome-icon :icon="['fas', 'plus']" />
      </div>
    </div>
    <screen-share-channel-list-item
      v-for="screenShareChannel in screenShareChannels"
      :key="screenShareChannel.channelId"
      :channelData="screenShareChannel"
      :users="users"
    >
    </screen-share-channel-list-item>
  </div>
</template>

<script>
import MessageChannelListItem from "./MessageChannelListItem.vue";
import { createChannel } from "../../api/channels";
import { createVoiceChannel } from "../../api/voiceChannels";
import { createScreenShareChannel } from "../../socket/screen-share";
import VoiceChannelListItem from "./VoiceChannelListItem.vue";
import ScreenShareChannelListItem from "./ScreenShareChannelListItem.vue";
import { playVoiceChannelConnectionSound } from "../../audio/index.js";

export default {
  components: {
    MessageChannelListItem,
    VoiceChannelListItem,
    ScreenShareChannelListItem
  },
  props: {
    channelId: {
      type: String
    },
    channels: {
      type: Array,
      require: true
    },
    screenShareChannels: {
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
    },
    async addScreenShareChannel() {
      this.$store.commit("setJoiningVoiceChannelState", true);
      try {
        if (this.$store.getters.getLocalMediaStream === null) {
          await this.$store.dispatch("setupLocalMedia");
        }
        if (this.$store.getters.getDisplayMediaStream === null) {
          const displayStream = await this.$store.dispatch("setupDisplayMedia");
          if(!displayStream) {
            alert("화면 공유를 사용할 수 없거나 취소하였습니다");
            return;
          }
        }
        await createScreenShareChannel();
        playVoiceChannelConnectionSound();
      } catch (error) {
        console.log(error);
      } finally {
        this.$store.commit("setJoiningVoiceChannelState", false);
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
