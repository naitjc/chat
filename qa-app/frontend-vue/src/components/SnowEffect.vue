<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const canvasRef = ref(null);
let animationFrameId;
const snowflakes = [];

// 根据硬件并发数调整粒子数量
const numFlakes = Math.min(80, Math.max(30, (navigator.hardwareConcurrency || 4) * 8));

class Snowflake {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(init = false) {
    this.x = Math.random() * this.canvas.width;
    this.y = init ? Math.random() * this.canvas.height : -20;
    this.size = Math.random() * 14 + 8;
    this.speed = Math.random() * 0.8 + 0.3;
    this.wind = Math.random() * 0.4 - 0.2;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.char = ['❄', '❅', '❆'][Math.floor(Math.random() * 3)];
  }

  update() {
    this.y += this.speed;
    this.x += this.wind;

    if (this.y > this.canvas.height + 20) this.reset();
    if (this.x > this.canvas.width + 20) this.x = -20;
    else if (this.x < -20) this.x = this.canvas.width + 20;
  }

  draw(ctx) {
    ctx.globalAlpha = this.opacity;
    ctx.font = `${this.size}px serif`;
    ctx.fillStyle = 'rgba(180, 214, 255, 0.9)';
    ctx.fillText(this.char, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

const animate = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 页面不可见时暂停
  if (document.visibilityState === 'hidden') {
    animationFrameId = requestAnimationFrame(animate);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  snowflakes.forEach(f => { f.update(); f.draw(ctx); });
  animationFrameId = requestAnimationFrame(animate);
};

const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
  }
};

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
    for (let i = 0; i < numFlakes; i++) snowflakes.push(new Snowflake(canvasRef.value));
    animate();
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', () => {}); // 触发重绘判断
  }
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
  snowflakes.length = 0;
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
  pointer-events: none;
  z-index: 0;
}
</style>
