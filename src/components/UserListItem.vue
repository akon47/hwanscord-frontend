<template>
  <li>
    <div>
      {{ username }}
    </div>
  </li>
</template>

<script>
export default {
  props: {
    username: {
      type: String,
      require: true
    }
  }
};
</script>

<style></style>
