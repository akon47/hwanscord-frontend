<template>
  <div class="user-list">
    <div class="status">
      <span>온라인</span>
      <span> - </span>
      <span>{{ this.onlineUsers.length }}</span>
    </div>
    <user-list-item
      v-for="user in onlineUsers"
      v-bind:key="user._id"
      v-bind:userData="user"
    ></user-list-item>
    <div class="status">
      <span>오프라인</span>
      <span> - </span>
      <span>{{ this.offlineUsers.length }}</span>
    </div>
    <user-list-item
      v-for="user in offlineUsers"
      v-bind:key="user._id"
      v-bind:userData="user"
    ></user-list-item>
  </div>
</template>

<script>
import UserListItem from "./UserListItem.vue";

export default {
  components: {
    UserListItem,
  },
  props: {
    users: {
      type: Array,
    },
  },
  computed: {
    onlineUsers() {
      return this.users.filter((elem) => elem.connections > 0);
    },
    offlineUsers() {
      return this.users.filter((elem) => elem.connections <= 0);
    },
  },
};
</script>

<style scoped>

.status {
  color: #CCCCCC;
  font-size: 10pt;
  font-weight: bold;
  margin: 10px;
}

.user-list {
  height: 100%;
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
}

.user-list::-webkit-scrollbar {
  width: 10px;
}
.user-list::-webkit-scrollbar-thumb {
  background-color: #212121;
  border-radius: 10px;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.user-list::-webkit-scrollbar-track {
  background-color: #00000030;
  border-radius: 10px;
  background-clip: padding-box;
  border: 2px solid transparent;
}
</style>
