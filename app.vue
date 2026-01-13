<template>
  <div id="app">
    <NuxtRouteAnnouncer />
    <div class="app__content">
      <NuxtPage />
    </div>
    <Footer />
  </div>
</template>

<style>
@import './assets/styles/variables.css';
@import './assets/styles/base.css';

#app {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.app__content {
  flex: 1;
}
</style>
