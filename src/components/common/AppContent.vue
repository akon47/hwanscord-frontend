<template>
  <div class="h-100">
    <star-sky v-if="$route.path == '/signup' || $route.path == '/signin'"></star-sky>
    <transition name="component-fade" mode="out-in">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
import StarSky from "../background/StarSky.vue";
export default {
  components: { StarSky },
};
</script>

<style scoped>
.content {
  background-color: #313131;
}
.component-fade-enter-active,
.component-fade-leave-active {
  transition: all 0.15s ease;
}
.component-fade-enter,
.component-fade-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}
</style>
