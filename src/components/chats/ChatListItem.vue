<template>
  <div class="root">
    <div class="avatar">
      <img />
    </div>
    <span>
      <div>
        <span class="username">{{ message.createdBy.username }}</span>
        <span class="date">{{ message.createdAt | formatDate }}</span>
        <span class="edited" v-if="isEdited">(수정됨)</span>
      </div>
      <div class="message">
        {{ message.message }}
      </div>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    message: {
      type: Object,
    },
  },
  computed: {
    isEdited() {
      return this.message.createdAt !== this.message.updatedAt;
    },
  },
};
</script>

<style scoped>
.root {
  width: 100%;
  padding: 5px;
}

.avatar {
  float: left;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: purple;
  margin-top: 10px;
  margin-left: 10px;
  margin-right: 15px;
}

.message {
  color: white;
  font-size: 12pt;
  font-weight: 500;
}

.username {
  color: white;
  font-size: 12pt;
  font-weight: 700;
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
