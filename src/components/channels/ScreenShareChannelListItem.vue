<template>
  <div>

  </div>
</template>

<script>
export default {

};
</script>

<style>
.context-menu {
  position: absolute;
  width: 100px;
  right: 30px;
  z-index: 1000;
}

.icon {
  color: #b9bbbe;
  transition: 0.2s;
}
.icon:hover {
  color: #dcddde;
}

.header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.root {
  display: flex;
  position: relative;
  width: calc(100% - 10px);
  padding: 5px;
  margin: 5px;
  background-color: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  line-height: 20px;
  color: darkgray;
  padding-left: 15px;
  justify-content: space-between;
}

.root:hover {
  background-color: rgb(52, 55, 60);
  color: white;
}

.selected {
  background-color: rgb(57, 60, 67);
  color: white;
}

.selected:hover {
  background-color: rgb(57, 60, 67);
}

:focus {
  outline: none;
}
</style>