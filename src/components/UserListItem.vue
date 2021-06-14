<template>

  <div class="root" v-bind:style="{ opacity: `${opacity}` }">
    <div class="avatar">
      <img />
    </div>
    <span>
      <div>
        <span class="username">{{ userData.username }}</span>
      </div>
      <div class="status">
        <p v-if="isOnline">온라인</p>
        <p v-else>오프라인</p>
      </div>
    </span>
  </div>
</template>

<script>
export default {
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
    opacity() {
      return this.userData.connections > 0 ? 1.0 : 0.5;
    }
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
  font-weight: bold;
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
