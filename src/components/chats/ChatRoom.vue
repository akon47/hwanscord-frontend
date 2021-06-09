<template>
  <div class="h-100">
    <div class="chat-area">
      <ul>
        <chat-list-item
          v-for="message in messages"
          v-bind:key="message._id"
          v-bind:message="message"
        ></chat-list-item>
      </ul>
    </div>
    <div class="chatinput-area">
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
    ChatListItem
  },
  props: {
    messages: {
      type: Array
    }
  }
};
</script>

<style scoped>
.chat-area {
  height: calc(100% - 68px);
}
</style>
