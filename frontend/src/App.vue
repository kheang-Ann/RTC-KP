<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoginForm from './components/Auth/LoginForm.vue'
</script>

<template>
  <div id="app">
    <LoginForm />
    <RouterView />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box; /* Makes sure padding doesn't increase element size */
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden; /* Fixes horizontal scroll */
}
</style>
