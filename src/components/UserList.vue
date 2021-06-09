<template>
  <div>
    <ul>
      <user-list-item
        v-for="user in users"
        v-bind:key="user._id"
        v-bind:userData="user"
      ></user-list-item>
    </ul>
  </div>
</template>

<script>
import UserListItem from "./UserListItem.vue";

export default {
  components: {
    UserListItem
  },
  computed: {
    users() {
      return this.$store.users;
    }
  }
};
</script>
