<template>
  <div class="root">
    <span>
      <avatar v-bind:userData="userData"></avatar>
    </span>
    <span class="message">
      <div>
        <span class="username">{{ message.createdBy.username }}</span>
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
  </div>
</template>

<script>
import Avatar from "../Avatar.vue";
export default {
  components: { Avatar },
  data() {
    return {
      isImage: false,
      isImageLoading: true,
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
  },
  computed: {
    isEdited() {
      return this.message.createdAt !== this.message.updatedAt;
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
  }
};
</script>

<style scoped>
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
  max-width: 300px;
  max-height: 300px;
  margin-top: 10px;
  border-radius: 5px;
}

.root {
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
  border-radius: 0px;
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
