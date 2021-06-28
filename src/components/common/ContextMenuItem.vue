<template>
  <div class="menu-item" @click.stop="click">
    {{ header }}
  </div>
</template>

<script>
export default {
  props: {
    header: {
      type: String,
      require: true,
    },
  },
  methods: {
    click() {
      this.$emit("click");
    },
  },
};
</script>

<style scoped>
.menu-item {
  display: flex;
  justify-content: center;
  font-size: 12pt;
  font-weight: bold;
  color: rgb(185, 187, 190);
  border-radius: 5px;
  background-color: transparent;
  padding: 3px 5px;
  margin: 2px 0px;
  z-index: 2000;
  cursor: pointer;
}

.menu-item:hover {
  background-color: rgb(71, 82, 196);
  color: white;
}
</style>