<template>
  <div class="h-100">
    <loading-spinner v-if="isLoading"></loading-spinner>
    <div v-else class="h-100">
      <div class="message-area" :class="{ mobile: $isMobile() }">
        <chat-room v-bind:messages="messages" v-bind:users="users"></chat-room>
      </div>
      <div class="user-area" v-if="!$isMobile()">
        <div id="user-list">
          <user-list v-bind:users="users"></user-list>
        </div>
        <div id="current-info">
          <div
            id="avatar"
            v-bind:style="{ backgroundImage: `url(${avatarUrl})` }"
          >
            <div style="position: relative; height: 100%; width: 100%">
              <div id="avatar-change-message">
                <label for="avatar-file" style="cursor: pointer"
                  >아바타<br />변경</label
                >
              </div>
              <input
                id="avatar-file"
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                style="
                  position: absolute;
                  top: 0px;
                  left: 0px;
                  width: 100%;
                  height: 100%;
                  opacity: 0;
                  cursor: pointer;
                "
                @change="handleFileChange"
              />
            </div>
          </div>
          <div id="userinfo">
            {{ $store.state.username }}
          </div>
        </div>
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
import { uploadAvatar } from "../api/avatar";
import { apiUrl } from "../api/index";

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
  computed: {
    avatarUrl() {
      try {
        const user = this.users.find(
          (elem) => elem.username === this.$store.state.username
        );
        return `${apiUrl}${user.avatar.filepath}`;
      } catch (error) {
        return null;
      }
    },
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      try {
        const messageData = await fetchMessages();
        this.messages = messageData.data.messages;

        const userData = await fetchUsers();
        this.users = userData.data.users;
      } catch (error) {
        if (this.$socket.client.connected) {
          this.$socket.client.disconnect();
        }
        this.$store.dispatch("Signout");
        this.$router.push("/");
      } finally {
        this.isLoading = false;
      }
    },
    updateUserConnection(data) {
      const index = this.users.findIndex((elem) => elem._id === data.userid);
      if (index >= 0) {
        const user = this.users[index];
        user.connections = data.connections;
        this.$set(this.users, index, user);
      }
    },
    updateUserAvatar(data) {
      const index = this.users.findIndex((elem) => elem._id === data.userid);
      if (index >= 0) {
        const user = this.users[index];
        user.avatar = data.avatar;
        this.$set(this.users, index, user);
      }
    },
    async handleFileChange(e) {
      const file = e.target.files[0];
      await uploadAvatar(file);
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
    newMessageReceived(data) {
      this.messages.push(data);
    },
    messageDeleted(data) {
      const index = this.messages.findIndex(
        (elem) => elem._id === data.messageid
      );
      if (index >= 0) {
        this.messages.splice(index, 1);
      }
    },
    messageModified(data) {
      const index = this.messages.findIndex((elem) => elem._id === data._id);
      if (index >= 0) {
        this.$set(this.messages, index, data);
      }
    },
    userAvatarChanged(data) {
      this.updateUserAvatar(data);
    },
    userConnected(data) {
      this.updateUserConnection(data);
    },
    userDisconnected(data) {
      this.updateUserConnection(data);
    },
  },
};
</script>

<style scoped>
div.message-area {
  width: calc(100% - 250px);
  height: 100%;
  float: left;
  box-sizing: border-box;
  background: #36393f;
}

div.mobile {
  width: 100%;
}

div.user-area {
  width: 250px;
  height: 100%;
  float: right;
  box-sizing: border-box;
  background: #2f3136;
}

#user-list {
  height: calc(100% - 80px);
}

#current-info {
  display: flex;
  height: 70px;
  background-color: #292b2f;
  user-select: none;
}

#avatar {
  float: left;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #7289da;
  background-position: 50%;
  background-size: cover;
  background-repeat: no-repeat;
  color: transparent;

  display: flex;
  margin: 10px;
  margin-right: 15px;
  cursor: pointer;
  font-size: 8pt;
  text-align: center;
  justify-content: center;
  flex-direction: column;
}

#avatar-change-message {
  display: flex;
  border-radius: 50%;
  position: absolute;
  justify-content: center;
  align-items: center;
  line-height: 12px;
  white-space: pre;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

#avatar-change-message:hover {
  color: white;
  background-color: #00000060;
}

#userinfo {
  color: white;
  font-size: 14pt;
  font-weight: bold;
  vertical-align: middle;
  line-height: 70px;
}
</style>
