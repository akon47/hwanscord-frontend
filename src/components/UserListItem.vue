<template>
  <div class="root" :class="{offline: !isOnline}">
    <span>
      <avatar v-bind:userData="userData" @click="avatarClick"></avatar>
    </span>
    <span class="userinfo">
      <div>
        <span>{{ userData.username }}</span>
      </div>
      <div class="status">
        <p v-if="isOnline">온라인</p>
        <p v-else>오프라인</p>
      </div>
    </span>
  </div>
</template>

<script>
import Avatar from "./Avatar.vue";
export default {
  components: { Avatar },
  props: {
    userData: {
      type: Object,
      require: true,
    },
  },
  computed: {
    isOnline() {
      return this.userData.connections > 0;
    },
  },
  methods: {
    avatarClick() {
      this.$emit("avatarClick", this.userData);
    },
  },
};
</script>

<style scoped>
.status {
  font-size: 10pt;
  color: #b0b0b0;
  font-weight: bold;
}

.root {
  width: calc(100% - 10px);
  padding: 5px;
  padding-bottom: 10px;
  margin: 5px;
  cursor: default;
  background-color: transparent;
  border-radius: 5px;
}

.offline {
  opacity: 0.5;
}

.root:hover {
  background-color: rgb(57, 60, 67);
  border-radius: 5px;
  opacity: 1;
}

.avatar {
  float: left;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #7289da;

  margin-left: 10px;
  margin-right: 15px;
  cursor: pointer;
}

.userinfo {
  color: white;
  font-size: 12pt;
  font-weight: bold;
}
</style>
