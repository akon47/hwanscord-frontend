<template>
  <div class="h-100">
    <loading-spinner v-if="isLoading"></loading-spinner>
    <div v-else class="h-100">
      <div class="channel-area" :class="{ mobile: $isMobile(), 'mobile-selected': isChannelAreaSelected }">
        <div class="channel-list">
          <channel-list
            :channelId="channelId"
            :channels="channels"
            :voiceChannels="voiceChannels"
            :users="users"
          ></channel-list>
        </div>
        <div class="voice-chat" :class="{ joined: isVoiceChannelJoined || isVoiceChannelJoining }">
          <voice-chat :voiceChannels="voiceChannels" />
        </div>
        <div class="current-info">
          <div class="avatar" :style="{ backgroundImage: `url(${avatarUrl})` }">
            <div style="position: relative; height: 100%; width: 100%">
              <div class="avatar-change-message">
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
          <div class="userinfo">
            {{ $store.state.username }}
          </div>
        </div>
      </div>
      <div class="message-area" :class="{ mobile: $isMobile() }" v-show="!$isMobile() || (!isChannelAreaSelected && !isUserAreaSelected)">
        <chat-room :channelId="channelId" :users="users"></chat-room>
      </div>
      <div class="user-area" :class="{ mobile: $isMobile(), 'mobile-selected': isUserAreaSelected }">
        <div class="user-list">
          <user-list :users="users"></user-list>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChatRoom from "../components/chats/ChatRoom.vue";
import UserList from "../components/UserList.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import { fetchChannels } from "../api/channels";
import { fetchVoiceChannels } from "../api/voiceChannels";
import { fetchUsers } from "../api/users";
import { uploadAvatar } from "../api/avatar";
import { apiUrl } from "../api/index";
import ChannelList from "../components/channels/ChannelList.vue";
import VoiceChat from "../components/voice/VoiceChat.vue";

export default {
  components: {
    UserList,
    ChatRoom,
    LoadingSpinner,
    ChannelList,
    VoiceChat,
  },
  props: {
    channelId: {
      type: String,
    },
  },
  data() {
    return {
      channels: [],
      voiceChannels: [],
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
    isVoiceChannelJoining() {
      return this.$store.getters.isVoiceChannelJoining;
    },
    isVoiceChannelJoined() {
      return this.$store.getters.isVoiceChannelJoined;
    },
    isChannelAreaSelected() {
      return this.$store.getters.getMobileVisiblePage === "channels" ;
    },
    isUserAreaSelected() {
      return this.$store.getters.getMobileVisiblePage === "users" ;
    },
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      try {
        const channelData = await fetchChannels();
        this.channels = channelData.data.channels;

        const voiceChannelData = await fetchVoiceChannels();
        this.voiceChannels = voiceChannelData.data.channels;

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
      const index = this.users.findIndex((elem) => elem._id === data.userId);
      if (index >= 0) {
        const user = this.users[index];
        user.connections = data.connections;
        this.$set(this.users, index, user);
      }
    },
    updateUserAvatar(data) {
      const index = this.users.findIndex((elem) => elem._id === data.userId);
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
          this.channels = this.channels.slice();
          this.users = this.users.slice();
        });
      }
    },
  },
  created() {
    this.fetchData();
  },
  sockets: {
    newUserSignup(data) {
      this.users.push(data);
    },

    newChannelAdded(data) {
      this.channels.push(data);
    },
    channelModified(data) {
      const index = this.channels.findIndex((elem) => elem._id === data._id);
      if (index >= 0) {
        this.$set(this.channels, index, data);
      }
    },
    channelDeleted(data) {
      const index = this.channels.findIndex((elem) => elem._id === data._id);
      if (index >= 0) {
        this.channels.splice(index, 1);
      }

      if (data._id === this.channelId) {
        this.$router.push("/main/@me");
      }
    },
    newVoiceChannelAdded(data) {
      this.voiceChannels.push(data);
    },
    voiceChannelModified(data) {
      const index = this.voiceChannels.findIndex(
        (elem) => elem._id === data._id
      );
      if (index >= 0) {
        this.$set(this.voiceChannels, index, data);
      }
    },
    voiceChannelDeleted(data) {
      const index = this.voiceChannels.findIndex(
        (elem) => elem._id === data._id
      );
      if (index >= 0) {
        this.voiceChannels.splice(index, 1);
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
div.channel-area {
  display: flex;
  
  width: 230px;
  height: 100%;
  box-sizing: border-box;
  background: #2f3136;
  float: left;
  align-content: flex-start;
  align-items: stretch;
  flex-direction: column;
}

div.channel-list {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

div.voice-chat {
  position: relative;
  background-color: rgb(41, 43, 47);
  box-sizing: border-box;
  overflow: hidden;
  flex: 0 0 0px;
}

div .joined {
  flex: 0 0 52px;
  border-bottom: 1px solid rgb(54, 55, 59);
}

div.message-area {
  width: calc(100% - 460px);
  height: 100%;
  float: left;
  box-sizing: border-box;
  background: #36393f;
}

div.user-area {
  display: flex;
  width: 230px;
  height: 100%;
  float: right;
  box-sizing: border-box;
  background: #2f3136;
  align-content: flex-start;
  align-items: stretch;
  flex-direction: column;
}

div.mobile {
  width: 100%;
}

div.channel-area.mobile {
  position: absolute;
  height: calc(100% - 60px);
  z-index: 0;
  opacity: 0;
  transition: 0.3s;
}

div.user-area.mobile {
  position: absolute;
  height: calc(100% - 60px);
  z-index: 0;
  opacity: 0;
  transition: 0.3s;
}

div.user-area.mobile-selected {
  opacity: 1;
  z-index: 5000;
}

div.message-area.mobile {
  position: absolute;
  height: calc(100% - 60px);
  z-index: 3000;
}

div.channel-area.mobile-selected {
  opacity: 1;
  z-index: 5000;
}

div.user-list {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.current-info {
  position: relative;
  background-color: #292b2f;
  box-sizing: border-box;
  overflow: hidden;
  flex: 0 0 70px;
}

.avatar {
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

.avatar-change-message {
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

.avatar-change-message:hover {
  color: white;
  background-color: #00000060;
}

.userinfo {
  color: white;
  font-size: 14pt;
  font-weight: bold;
  vertical-align: middle;
  line-height: 70px;
}
</style>
