<template>
  <div class="root">
    <div class="stars">
      <div
        v-for="index in stars"
        :key="index"
        class="star"
        :style="randomStarStyle()"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    stars: {
      type: Number,
      default: 800,
    },
  },
  methods: {
    randomStarStyle() {
      const r = 800;
      const s = 0.2 + Math.random() * 1;
      const curR = r + Math.random() * 300;
      return {
        transformOrigin: "0 0 " + curR + "px",
        transform:
          " translate3d(0,0,-" +
          curR +
          "px) rotateY(" +
          Math.random() * 360 +
          "deg) rotateX(" +
          Math.random() * -50 +
          "deg) scale(" +
          s +
          "," +
          s +
          ")",
      };
    },
  },
};
</script>

<style scoped>
@keyframes rotate {
  0% {
    transform: perspective(400px) rotateZ(20deg) rotateX(-40deg) rotateY(0);
  }
  100% {
    transform: perspective(400px) rotateZ(20deg) rotateX(-40deg)
      rotateY(-360deg);
  }
}

.root {
  position: fixed;
  background: radial-gradient(
    200% 100% at bottom center,
    #f7f7b6,
    #e96f92,
    #75517d,
    #1b2947
  );
  background: radial-gradient(
    220% 105% at top center,
    #1b2947 10%,
    #75517d 80%,
    #e96f92 90%,
    #f7f7b6
  );
  background-attachment: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  z-index: -1000;
}
.stars {
  transform: perspective(400px);
  transform-style: preserve-3d;
  position: absolute;
  bottom: 0;
  perspective-origin: 50% 100%;
  left: 50%;
  animation: rotate 180s infinite linear;
}
.star {
  width: 2px;
  height: 2px;
  background: #f7f7b6;
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0 -300px;
  transform: translate3d(0, 0, -300px);
  backface-visibility: hidden;
}
</style>