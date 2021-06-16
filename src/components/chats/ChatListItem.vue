<template>
  <div class="root">
    <span>
      <avatar v-bind:userData="userData"></avatar>
    </span>
    <span class="message">
      <div>
        <span :class="{username: true, myname: isMyMessage}">{{ message.createdBy.username }}</span>
        <span class="date">{{ message.createdAt | formatDate }}</span>
        <span class="edited" v-if="isEdited">(수정됨)</span>
      </div>
      <div style="cursor: auto">
        <span v-if="!isUrl">{{ message.message }}</span>
        <span v-else-if="isImage || isImageLoading">
          <a :href="message.message" target="_blank">
            <span v-if="isImageLoading">{{ message.message }}</span>
            <img :src="message.message" @load="imgLoad" @error="imgError" />
          </a>
        </span>
        <span v-else
          ><a :href="message.message" target="_blank">{{
            message.message
          }}</a></span
        >
      </div>
    </span>

    <context-menu
      v-if="isMyMessage"
      class="context-menu"
      :menuItems="menuItems"
      v-model="isMenuOpened"
    />

    <div v-if="isMyMessage" class="menu" @click="menuClick">
      <svg
        viewBox="0 0 24 24"
        style="
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          padding: 1px;
        "
      >
        <path
          fill="currentColor"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M7 12.001C7 10.8964 6.10457 10.001 5 10.001C3.89543 10.001 3 10.8964 3 12.001C3 13.1055 3.89543 14.001 5 14.001C6.10457 14.001 7 13.1055 7 12.001ZM14 12.001C14 10.8964 13.1046 10.001 12 10.001C10.8954 10.001 10 10.8964 10 12.001C10 13.1055 10.8954 14.001 12 14.001C13.1046 14.001 14 13.1055 14 12.001ZM19 10.001C20.1046 10.001 21 10.8964 21 12.001C21 13.1055 20.1046 14.001 19 14.001C17.8954 14.001 17 13.1055 17 12.001C17 10.8964 17.8954 10.001 19 10.001Z"
        ></path>
      </svg>
    </div>
  </div>
</template>

<script>
import Avatar from "../Avatar.vue";
import ContextMenu from "../common/ContextMenu.vue";
import { deleteMessage, modifyMessage } from "../../api/messages";

export default {
  components: { Avatar, ContextMenu },
  data() {
    return {
      isImage: false,
      isImageLoading: true,
      menuItems: [
        { header: "수정", callback: () => this.modify() },
        { header: "삭제", callback: () => this.delete() },
      ],
      isMenuOpened: false,
    };
  },
  props: {
    message: {
      type: Object,
      require: true,
    },
    users: {
      type: Array,
      require: true,
    },
  },
  methods: {
    imgLoad() {
      this.isImage = true;
      this.isImageLoading = false;
      this.$emit("imgload");
    },
    imgError() {
      this.isImage = false;
      this.isImageLoading = false;
    },
    menuClick() {
      this.isMenuOpened = true;
    },
    async modify() {
      const text = prompt("메시지 수정", this.message.message);
      if(text) {
        await modifyMessage(this.message._id, text);
      }
    },
    async delete() {
      await deleteMessage(this.message._id);
    },
  },
  computed: {
    isEdited() {
      return this.message.createdAt !== this.message.updatedAt;
    },
    isMyMessage() {
      return this.message.createdBy.username === this.$store.state.username;
    },
    userData() {
      return this.users.find((elem) => elem._id === this.message.createdBy._id);
    },
    isUrl() {
      let url;
      try {
        url = new URL(this.message.message);
      } catch (_) {
        return false;
      }
      return url.protocol === "https:";
    },
  },
};
</script>

<style scoped>
.context-menu {
  position: absolute;
  width: 100px;

  top: -14px;
  right: 60px;
}

.menu {
  position: absolute;
  border-radius: 5px;
  border: #212121 solid 1px;
  background: #36393f;
  width: 28px;
  height: 28px;
  top: 0;
  right: 0;
  margin-right: 20px;
  margin-top: -14px;
  opacity: 0;
  color: #b9bbbe;
}
.menu:hover {
  color: #dcddde;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.6);
}

.root:hover > .menu {
  opacity: 1;
}

a:link {
  color: #00aff4;
}
a:visited {
  color: #00aff4;
}
a:hover {
  text-decoration: underline;
}

img {
  width: auto;
  height: auth;
  max-width: 500px;
  max-height: 300px;
  margin-top: 10px;
  border-radius: 5px;
}

.root {
  position: relative;
  width: calc(100% - 0px);
  padding: 5px;
  padding-bottom: 10px;
  padding-left: 10px;
  margin: 0px;
  cursor: default;
  background-color: transparent;
  word-wrap: break-word;
}

.root:hover {
  background-color: #32353b;
}

.message {
  color: white;
  font-size: 12pt;
  font-weight: normal;
}

.username {
  color: white;
  font-size: 12pt;
  font-weight: bold;
}

.myname {
  color: #3498db;
}

.username:hover {
  cursor: pointer;
  text-decoration: underline;
}

.date {
  color: gray;
  font-size: 10pt;
  margin-left: 5px;
}

.edited {
  color: gray;
  font-size: 10pt;
  margin-left: 5px;
}
</style>
