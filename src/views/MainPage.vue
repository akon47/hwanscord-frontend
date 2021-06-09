<template>
  <div class="h-100">
    <div class="left">
      <chat-room v-bind:messages="messages"></chat-room>
    </div>
    <div class="right">
      <user-list></user-list>
    </div>
  </div>
</template>

<script>
import ChatRoom from "../components/chats/ChatRoom.vue";
import UserList from "../components/UserList.vue";
import { fetchMessages } from "../api/messages";
export default {
  components: {
    UserList,
    ChatRoom
  },
  data() {
    return {
      messages: [],
      isLoading: false
    };
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      const { data } = await fetchMessages();
      this.messages = data.messages;
      this.isLoading = false;
    }
  },
  created() {
    this.fetchData();
  }
};
</script>

<style scoped>
div.left {
  width: calc(100% - 250px);
  height: 100%;
  float: left;
  box-sizing: border-box;
  background: #363636;
}
div.right {
  width: 250px;
  height: 100%;
  float: right;
  box-sizing: border-box;
  background: #313131;
}
</style>
