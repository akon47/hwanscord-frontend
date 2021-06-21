<template>
  <div class="root" :class="{ selected: isSelected }" @click="click">
    <span> # </span>
    {{ channelData.channelName }}
  </div>
</template>

<script>
export default {
  props: {
    currentChannelId: {
      type: String,
    },
    channelData: {
      type: Object,
      require: true
    }
  },
  methods: {
    click() {
      if(!this.isSelected) {
        this.$router.push(`/main/${this.channelData._id}`);
      }
    }
  },
  computed: {
    isSelected() {
      return this.currentChannelId === this.channelData._id;
    }
  }
};
</script>

<style scoped>
.root {
  width: calc(100% - 10px);
  padding: 3px;
  padding-bottom: 7px;
  margin: 5px;
  background-color: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13pt;
  font-weight: bold;
  color: darkgray;
  padding-left: 15px;
}

.root:hover {
  background-color: rgb(52, 55, 60);
  color: white;
}

.selected {
  background-color: rgb(57, 60, 67);
  color: white;
}

.selected:hover {
  background-color: rgb(57, 60, 67);
}
</style>
