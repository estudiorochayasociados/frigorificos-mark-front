<template>
  <div class="not-found-page">
    <div class="not-found-card">
      <img src="/images/logo.png" alt="Mark" />
      <strong>404</strong>
      <h1>Página no encontrada</h1>
      <p>La dirección ingresada no corresponde a una pantalla disponible.</p>
      <q-btn unelevated color="red" to="/" label="Volver al inicio" no-caps />
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 20px;
  background: var(--canvas);
}

.not-found-card {
  display: grid;
  width: min(100%, 460px);
  justify-items: center;
  padding: clamp(24px, 7vw, 44px);
  border: 1px solid var(--line);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 60px rgb(0 0 0 / 8%);
  text-align: center;
}

.not-found-card img {
  width: 120px;
  margin-bottom: 18px;
}

.not-found-card > strong {
  color: var(--brand);
  font-size: clamp(64px, 20vw, 120px);
  letter-spacing: -0.08em;
  line-height: 0.9;
}

.not-found-card h1 {
  margin: 22px 0 0;
  font-size: clamp(22px, 6vw, 30px);
}

.not-found-card p {
  margin: 9px 0 24px;
  color: var(--muted);
  font-size: 14px;
}

.not-found-card .q-btn {
  min-height: 44px;
}
</style>
