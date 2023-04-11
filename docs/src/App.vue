<template>
  <section class="hero is-dark is-small">
    <div class="hero-body">
      <div class="container">
        <p class="title">Bottom Time API Documentation</p>
        <p class="subtitle">Version 1.0.0</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <openapi-explorer spec-url="/specs.yml" />
    </div>
  </section>
  <footer id="app-footer" class="footer">
    <div class="container has-text-centered">
      <p id="app-footer-copyright" class="content block">
        Copyright &copy; Chris Carleton, {{ new Date().getFullYear() }}
      </p>
    </div>
  </footer>
</template>

<style lang="css">
@import './assets/bulmaswatch.min.css';
</style>
