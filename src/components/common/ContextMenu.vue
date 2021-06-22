<template>
  <div v-show="value">
    <div class="context-menu-bg" @click="hide" />
    <transition name="slide-fade">
      <div class="context-menu-root" v-show="value">
        <context-menu-item
          v-for="(item, index) in menuItems"
          v-bind:key="index"
          v-bind:header="item.header"
          @click="menuClick(item.callback)"
        />
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script>
import ContextMenuItem from "./ContextMenuItem.vue";
export default {
  components: { ContextMenuItem },
  props: {
    menuItems: {
      type: Array,
    },
    value: {
      type: Boolean,
    },
  },
  methods: {
    hide() {
      this.$emit("input", false);
    },
    menuClick(callback) {
      callback();
      this.hide();
    },
  },
};
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease;
}
.slide-fade-leave-active {
  transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.context-menu-bg {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  z-index: 1000;
}

.context-menu-root {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 5px;
  background-color: rgb(24, 25, 28);
  width: 100%;
  height: 100%;
  padding: 2px 5px;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.6);
}
</style>