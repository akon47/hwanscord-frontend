<template>
  <div class="voice-channel-user">
    <div class="voice-channel-user-item">
      <span>
        <avatar v-bind:userData="userData"></avatar>
        <span class="userinfo">
          <span>{{ userData.username }}</span>
        </span>
      </span>
      <span class="status"> </span>
    </div>
  </div>
</template>

<script>
import Avatar from "../Avatar.vue";

export default {
  components: {
    Avatar
  },
  props: {
    peer: {
      type: Object,
      require: true
    },
    users: {
      type: Array,
      require: true
    }
  },
  computed: {
    userData() {
      return this.users.find(elem => elem._id === this.peer.user._id);
    }
  }
};
</script>

<style scoped>
.voice-channel-user {
  display: flex;
  position: relative;
  margin: 0px;
  padding: 0px 0px 8px 36px;
}

.voice-channel-user-item {
  display: flex;
  position: relative;
  width: calc(100% - 5px);
  background-color: transparent;
  border-radius: 5px;
  margin: 0px;
  padding: 0px;
  align-items: center;
  margin: 1px 0px;
  cursor: pointer;
}
.voice-channel-user-item:hover {
  background-color: rgb(57, 60, 67);
}

.voice-channel-user-item span {
    display: flex;
    position: relative;
    align-items: center;
}

.avatar {
  float: left; 
  width: 24px;
  height: 24px;
  margin: 3px 10px;
  border-radius: 50%;
  background-color: #7289da;
}

.userinfo {
  color: darkgray;
  font-size: 14px;
  line-height: 18px;
}
</style>
