<script lang="ts" setup></script>

<template>
  <div class="created-screen" role="status" aria-live="polite">
    <div class="created-panel">
      <h2 class="created-title">¡CUENTA CREADA!</h2>
      <div class="created-gem" aria-hidden="true">
        <span class="spark s1"></span>
        <span class="spark s2"></span>
        <span class="spark s3"></span>
        <span class="spark s4"></span>
        <span class="spark s5"></span>
        <span class="spark s6"></span>
        <div class="gem-shape">
          <span class="gem-check">✓</span>
        </div>
      </div>
      <p class="created-msg">
        TU CUENTA HA SIDO CREADA<br />
        EXITOSAMENTE
      </p>
    </div>
  </div>
</template>

<style scoped>
.created-screen {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('../assets/img/fondo.png');
  background-size: cover;
  background-position: center;
  animation: fade-in 0.35s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.created-panel {
  width: min(340px, 90vw);
  padding: 36px 28px 32px;
  border-radius: 18px;
  text-align: center;
  background: rgba(8, 20, 40, 0.72);
  border: 2px solid rgba(0, 180, 255, 0.4);
  box-shadow:
    0 0 30px rgba(0, 160, 255, 0.3),
    0 16px 40px rgba(0, 0, 0, 0.45),
    inset 0 0 24px rgba(0, 100, 180, 0.1);
  backdrop-filter: blur(6px);
}

.created-title {
  margin: 0 0 22px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #f0e6b8;
  text-shadow:
    0 0 12px rgba(232, 200, 106, 0.45),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.created-gem {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gem-shape {
  width: 78px;
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 90% 25%, 90% 75%, 50% 100%, 10% 75%, 10% 25%);
  background: linear-gradient(145deg, #7dffb0 0%, #22c55e 45%, #15803d 100%);
  box-shadow:
    0 0 24px rgba(50, 220, 120, 0.65),
    inset 0 0 16px rgba(255, 255, 255, 0.25);
  animation: gem-pulse 1.4s ease-in-out infinite;
}

.gem-check {
  color: #fff;
  font-size: 2.2rem;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  line-height: 1;
}

.spark {
  position: absolute;
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #e9a0ff, #a855f7);
  clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  opacity: 0.9;
  animation: sparkle 1.6s ease-in-out infinite;
}

.spark.s1 {
  top: 8%;
  left: 18%;
  animation-delay: 0s;
}
.spark.s2 {
  top: 12%;
  right: 14%;
  animation-delay: 0.25s;
  width: 10px;
  height: 10px;
}
.spark.s3 {
  bottom: 22%;
  left: 10%;
  animation-delay: 0.4s;
  width: 14px;
  height: 14px;
}
.spark.s4 {
  bottom: 18%;
  right: 12%;
  animation-delay: 0.55s;
}
.spark.s5 {
  top: 42%;
  left: 2%;
  animation-delay: 0.7s;
  width: 9px;
  height: 9px;
}
.spark.s6 {
  top: 38%;
  right: 4%;
  animation-delay: 0.15s;
  width: 11px;
  height: 11px;
}

.created-msg {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.45;
  color: #f0e6b8;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

@keyframes gem-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.06);
    filter: brightness(1.12);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.85) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) rotate(20deg);
  }
}
</style>
