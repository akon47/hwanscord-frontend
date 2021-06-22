<template>
  <div class="channel-list">
    <div class="channel-type">
      <span>채팅채널</span>
      <div class="icon" @click="addChannel">
        <font-awesome-icon :icon="['fas','plus']" />
      </div>
    </div>
    <channel-list-item
      v-for="channel in channels"
      :key="channel._id"
      :channelData="channel"
      :currentChannelId="currentChannelId"
    ></channel-list-item>
    <div class="channel-type">
      <span>음성채널</span>
    </div>
  </div>
</template>

<script>
import ChannelListItem from "./ChannelListItem.vue";
import { createChannel } from "../../api/channels";

export default {
  components: {
    ChannelListItem,
  },
  props: {
    currentChannelId: {
      type: String,
    },
    channels: {
      type: Array,
      require: true,
    },
  },
  methods: {
    async addChannel() {
      const channelName = prompt("채널 생성");
      if (channelName) {
        await createChannel(channelName);
      }
    },
  },
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

.user-list::-webkit-scrollbar {
  width: 10px;
}
.user-list::-webkit-scrollbar-thumb {
  background-color: #212121;
  border-radius: 10px;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.user-list::-webkit-scrollbar-track {
  background-color: #00000030;
  border-radius: 10px;
  background-clip: padding-box;
  border: 2px solid transparent;
}
</style>
