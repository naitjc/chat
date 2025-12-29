<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const canvasRef = ref(null);
let animationFrameId;

const snowflakes = [];
const numFlakes = 100;

class Snowflake {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 15 + 10; // Increased size for visibility
    this.speed = Math.random() * 1 + 0.5;
    this.wind = Math.random() * 0.5 - 0.25;
    this.char = ['❄', '❅', '❆'][Math.floor(Math.random() * 3)];
  }

  update() {
    this.y += this.speed;
    this.x += this.wind;

    if (this.y > this.canvas.height) {
      this.y = -this.size; // Start slightly above
      this.x = Math.random() * this.canvas.width;
    }
    if (this.x > this.canvas.width) {
      this.x = 0;
    } else if (this.x < 0) {
      this.x = this.canvas.width;
    }
  }

  draw(ctx) {
    ctx.font = `${this.size}px serif`;
    ctx.fillStyle = 'rgba(160, 216, 255, 0.9)';
    ctx.fillText(this.char, this.x, this.y);
  }
}

const initSnowflakes = (canvas) => {
  snowflakes.length = 0;
  for (let i = 0; i < numFlakes; i++) {
    snowflakes.push(new Snowflake(canvas));
  }
};

const animate = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snowflakes.forEach((flake) => {
    flake.update();
    flake.draw(ctx);
  });

  animationFrameId = requestAnimationFrame(animate);
};

const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
    // Re-initialize to ensure flakes cover new area or don't get stuck
    // But maybe better to just let them fall. Let's keep them.
  }
};

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
    initSnowflakes(canvasRef.value);
    animate();
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <canvas ref="canvasRef" class="snow-canvas"></canvas>
</template>

<style scoped>
.snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Ensure clicks pass through */
  z-index: 9999; /* On top of everything */
}
</style>
