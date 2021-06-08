<template>
  <div>
    <app-header></app-header>
    <app-content></app-content>
    <app-footer></app-footer>
  </div>
</template>

<script>
import AppContent from "./components/common/AppContent.vue";
import AppFooter from "./components/common/AppFooter.vue";
import AppHeader from "./components/common/AppHeader.vue";

export default {
  components: {
    AppHeader,
    AppContent,
    AppFooter
  }
}; 
</script>

<style></style>
