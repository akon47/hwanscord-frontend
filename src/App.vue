<template>
  <div class="app">
    <app-header></app-header>
    <div class="app-contents">
      <app-content></app-content>
    </div>
  </div>
</template>

<script>
import AppContent from "./components/common/AppContent.vue";
import AppHeader from "./components/common/AppHeader.vue";
export default {
  components: {
    AppHeader,
    AppContent
  }
}; 
</script>

<style>
@import './css/common.css';
@import './css/reset.css';
</style>