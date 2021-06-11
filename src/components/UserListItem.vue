<template>
  <div>
    {{ userData.username }}
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
};
</script>

<style>
</style>
