<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="auth">
    <div class="glow glow-a" aria-hidden="true" />
    <div class="glow glow-b" aria-hidden="true" />
    <main class="card">
      <p class="brand">HWANSCORD</p>
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #1b1d4a 0%, #3b2a6b 45%, #5865f2 100%);
  background-size: 200% 200%;
  animation: drift 18s ease-in-out infinite alternate;
}

.glow {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.45;
  pointer-events: none;
}

.glow-a {
  top: -160px;
  left: -120px;
  background: #eb459e;
}

.glow-b {
  right: -160px;
  bottom: -200px;
  background: #57f287;
  opacity: 0.25;
}

.card {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 32px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.brand {
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-align: center;
  color: var(--brand);
}

.title {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--header-primary);
}

.subtitle {
  margin-top: 6px;
  text-align: center;
  color: var(--header-secondary);
}

@keyframes drift {
  from {
    background-position: 0% 0%;
  }
  to {
    background-position: 100% 100%;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 24px 16px;
  }
}
</style>
