<template>
  <div class="h-100">
    <div class="chatarea" ref="chatarea">
      <chat-list-item
        v-for="(message, index) in messages"
        :key="message._id"
        :message="message"
        :messages="messages"
        :index="index"
        :users="users"
        @imgload="chatScrollToBottom(true)"
      ></chat-list-item>
    </div>
    <div class="chatinputbox">
      <chat-text-box></chat-text-box>
    </div>
    <!-- <file-drag-drop></file-drag-drop> -->
  </div>
</template>

<script>
// import FileDragDrop from '../common/FileDragDrop.vue';
import ChatListItem from "./ChatListItem.vue";
import ChatTextBox from "./ChatTextBox.vue";
export default {
  components: {
    ChatTextBox,
    ChatListItem,
    // FileDragDrop,
  },
  props: {
    messages: {
      type: Array,
    },
    users: {
      type: Array,
    },
  },
  methods: {
    onResize() {
      this.chatScrollToBottom(false);
    },
    chatScrollToBottom(smooth) {
      let chatarea = this.$refs.chatarea;
      chatarea.scrollTo({
        top: chatarea.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    },
  },
  watch: {
    messages() {
      this.$nextTick(() => this.chatScrollToBottom(true));
    },
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onResize);
  },
};
</script>

<style scoped>
.chatarea {
  height: calc(100% - 68px);
  overflow-y: auto;
  overflow-x: hidden;
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
