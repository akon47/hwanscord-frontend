<template>
  <div class="root">
    <div class="avatar">
      <img />
    </div>
    <span class="message">
      <div>
        <span class="username">{{ message.createdBy.username }}</span>
        <span class="date">{{ message.createdAt | formatDate }}</span>
        <span class="edited" v-if="isEdited">(수정됨)</span>
      </div>
      <div style="cursor: auto">
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
  width: calc(100% - 0px);
  padding: 5px;
  padding-bottom: 10px;
  margin: 0px;
  cursor: default;
  background-color: transparent;
}

.root:hover {
  background-color: #32353b;
  border-radius: 0px;
}

.avatar {
  float: left;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #7289da;
  margin-top: 1px;
  margin-left: 10px;
  margin-right: 15px;
  cursor: pointer;
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
