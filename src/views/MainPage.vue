<template>
  <div class="h-100">
    <loading-spinner v-if="isLoading"></loading-spinner>
    <div v-else class="h-100">
      <div class="message-area">
        <chat-room v-bind:messages="messages"></chat-room>
      </div>
      <div class="user-area">
        <user-list v-bind:users="users"></user-list>
      </div>
    </div>
  </div>
</template>

<script>
import ChatRoom from "../components/chats/ChatRoom.vue";
import UserList from "../components/UserList.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import { fetchMessages } from "../api/messages";
import { fetchUsers } from "../api/users";

export default {
  components: {
    UserList,
    ChatRoom,
    LoadingSpinner,
  },
  data() {
    return {
      messages: [],
      users: [],
      isLoading: false,
    };
  },
  methods: {
    async fetchData() {
      this.isLoading = true;

      const messageData = await fetchMessages();
      this.messages = messageData.data.messages;

      const userData = await fetchUsers();
      this.users = userData.data.users;

      this.isLoading = false;
    },
    updateUser(data) {
      console.log(data)
      const index = this.users.findIndex((element) => element._id === data.userid);
      if (index >= 0) {
        const user = this.users[index];
        user.connections = data.connections;
        this.$set(this.users, index, user);
      }
    },
  },
  watch: {
    isLoading() {
      if (!this.isLoading) {
        this.$nextTick(() => {
          this.messages = this.messages.slice();
          this.users = this.users.slice();
        });
      }
    },
  },
  created() {
    this.fetchData();
  },
  sockets: {
    connect() {
      console.log("socket connected");
    },
    connect_error() {
      console.log("connect_error");
    },
    newMessageReceived(data) {
      this.messages.push(data);
    },
    userConnected(data) {
      this.updateUser(data);
    },
    userDisconnected(data) {
      this.updateUser(data);
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

div.message-area {
  width: calc(100% - 250px);
  height: 100%;
  float: left;
  box-sizing: border-box;
  background: #363636;
}
div.user-area {
  width: 250px;
  height: 100%;
  float: right;
  box-sizing: border-box;
  background: #313131;
}
</style>
