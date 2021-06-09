<template>
  <li>
    {{ message.message }}
  </li>
</template>

<script>
export default {
  props: {
    message: {
      type: Object
    }
  }
};
</script>

<style></style>
