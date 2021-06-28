<template>
  <div>
    <h1>developer</h1>
    <a href="https://github.com/akon47" target="_blank">
      <div class="profile-image">
        <font-awesome-icon :icon="['fab', 'github']" class="git-icon"/>
      </div>
    </a>

    <div></div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
div {
  display: flex;
  align-items: center;
  justify-content: center;
}

div h1 {
  font-size: 24px;
  color: white;
  font-weight: bold;
  margin: 10px;
}

.profile-image {
  background-image: url(https://avatars.githubusercontent.com/u/49547202?v=4);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: transparent;
  background-position: 50%;
  background-size: cover;
  background-repeat: no-repeat;
  color: transparent;
  position: relative;
}

.profile-image .git-icon {
    font-size: 24px;
    color: white;
    position: absolute;
    bottom: -5px;
    right: -5px;
    background-color: black;
    border-radius: 50%;
}
</style>