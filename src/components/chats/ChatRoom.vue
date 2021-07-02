<template>
  <div v-if="isValidChannel & !isLoading" class="h-100">
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
      <chat-text-box :channelId="channelId"></chat-text-box>
    </div>
  </div>
  <div v-else class="h-100">
    <loading-spinner v-if="isLoading" />
    <div v-else class="h-100">
      <div class="invalid-message">채팅채널을 선택하여 참가하기</div>
      <div class="about-parent">
        <about></about>
      </div>
    </div>
  </div>
</template>

<script>
import ChatListItem from "./ChatListItem.vue";
import ChatTextBox from "./ChatTextBox.vue";
import { fetchMessages } from "../../api/messages";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import About from "../About.vue";
export default {
  components: {
    ChatTextBox,
    ChatListItem,
    LoadingSpinner,
    About,
  },
  data() {
    return {
      messages: [],
      isLoading: false,
      isValidChannel: false,
      disableNextScrollSmooth: true
    };
  },
  props: {
    channelId: {
      type: String,
    },
    users: {
      type: Array,
    },
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      if (this.channelId) {
        if (this.channelId === "@me") {
          this.isValidChannel = false;
          this.isLoading = false;
        } else {
          try {
            const messageData = await fetchMessages(this.channelId);
            this.disableNextScrollSmooth = true;
            this.messages = messageData.data.messages;
            this.isValidChannel = true;
          } catch (error) {
            this.isValidChannel = false;
          } finally {
            this.isLoading = false;
          }
        }
      }
    },
    onResize() {
      this.chatScrollToBottom(false);
    },
    chatScrollToBottom(smooth) {
      let chatarea = this.$refs.chatarea;
      if (chatarea) {
        chatarea.scrollTo({
          top: chatarea.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    },
  },
  watch: {
    messages() {
      const smooth = !this.disableNextScrollSmooth;
      this.$nextTick(() => this.chatScrollToBottom(smooth));
      if(this.disableNextScrollSmooth) {
        this.disableNextScrollSmooth = false;
      }
    },
    channelId() {
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
  },
  sockets: {
    newMessageReceived(data) {
      if (data.postedBy._id === this.channelId) {
        this.messages.push(data);
      }
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
  padding-bottom: 10px;
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

.invalid-message {
  display: flex;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin: 10px;
  margin-top: 50px;
  border-radius: 5px;
  padding: 10px;
  background-color: #00000020;
}

.about-parent {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
</style>
