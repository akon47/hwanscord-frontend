<template>
  <div class="h-100">
    <div class="chatarea" ref="chatarea">
      <chat-list-item
        v-for="message in messages"
        v-bind:key="message._id"
        v-bind:message="message"
      ></chat-list-item>
    </div>
    <div class="chatinputbox">
      <chat-text-box></chat-text-box>
    </div>
  </div>
</template>

<script>
import ChatListItem from "./ChatListItem.vue";
import ChatTextBox from "./ChatTextBox.vue";
export default {
  components: {
    ChatTextBox,
    ChatListItem,
  },
  sockets: {
    connect() {
      console.log("socket connected");
    },
  },
  props: {
    messages: {
      type: Array,
    },
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        let chatarea = this.$refs.chatarea;
        chatarea.scrollTo({ top: chatarea.scrollHeight, behavior: "smooth" });
        console.log("scrollTo");
      });
    },
  },
};
</script>

<style scoped>
.chatarea {
  height: calc(100% - 68px);
  overflow-y: auto;
}

.chatinputbox {
  overflow-y: auto;
}

.chatarea::-webkit-scrollbar {
  width: 18px;
}
.chatarea::-webkit-scrollbar-thumb {
  background-color: #212121;
  border-radius: 10px;
  background-clip: padding-box;
  border: 5px solid transparent;
}
.chatarea::-webkit-scrollbar-track {
  background-color: #00000030;
  border-radius: 10px;
  background-clip: padding-box;
  border: 5px solid transparent;
}
</style>
