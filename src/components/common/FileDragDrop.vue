<template>
  <div
    class="root"
    @drop.prevent="drop"
    @dragover.prevent="dragOver = true"
    @dragenter="dragOver = true"
    @dragleave="dragOver = false"
  >
    <div>
      <div v-for="(file, index) in files" v-bind:key="index">
        {{ file }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dragOver: false,
      files: [],
    };
  },
  methods: {
    drop(e) {
      this.dragOver = false;
      this.files = e.dataTransfer.files;
      console.log("drop");
    },
  },
};
</script>

<style scoped>
.root {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  
  z-index: 5000;
  color: white;
}
</style>