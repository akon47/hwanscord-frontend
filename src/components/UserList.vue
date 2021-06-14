<template>
  <div class="userlist">
    <user-list-item
      v-for="user in users"
      v-bind:key="user._id"
      v-bind:userData="user"
    ></user-list-item>
  </div>
</template>

<script>
import UserListItem from "./UserListItem.vue";

export default {
  components: {
    UserListItem
  },
  props: {
    users: {
      type: Array
    }
  },
};
</script>

<style scoped>
.userlist::-webkit-scrollbar {
  width: 18px;
}
.userlist::-webkit-scrollbar-thumb {
  background-color: #212121;
  border-radius: 10px;
  background-clip: padding-box;
  border: 5px solid transparent;
}
.userlist::-webkit-scrollbar-track {
  background-color: #00000030;
  border-radius: 10px;
  background-clip: padding-box;
  border: 5px solid transparent;
}
</style>
