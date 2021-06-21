<template>
  <div class="channel-list">
    <div class="channel-type">
      <span>채팅채널</span>
    </div>
    <channel-list-item
      v-for="channel in channels"
      :key="channel._id"
      :channelData="channel"
      :currentChannelId="currentChannelId"
    ></channel-list-item>
  </div>
</template>

<script>
import ChannelListItem from "./ChannelListItem.vue";
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

  }
};
</script>

<style scoped>
.channel-type {
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
