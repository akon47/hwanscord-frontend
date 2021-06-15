<template>
  <div
    v-if="avatarUrl"
    class="avatar"
    v-bind:style="{ backgroundImage: `url(${avatarUrl})` }"
  ></div>
  <div v-else class="avatar" style="background-color: #7289da"></div>
</template>

<script>
import { apiUrl } from "../api/index";

export default {
  props: {
    userData: {
      type: Object,
      require: true,
    },
  },
  computed: {
    avatarUrl() {
      try {
        return `${apiUrl}${this.userData.avatar.filepath}`;
      } catch (error) {
        return null;
      }
    },
  },
};
</script>

<style scoped>
.avatar {
  float: left;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: transparent;
  background-position: 50%;
  background-size: cover;
  background-repeat: no-repeat;
  color: transparent;

  display: flex;
  margin-right: 15px;
  cursor: pointer;
  font-size: 8pt;
  text-align: center;
  justify-content: center;
  flex-direction: column;
}
</style>