<template>
  <div class="login-screen">
    <router-view />
  </div>
</template>

<script lang="ts">

  export default {
    name: 'AuthLogin',
  }
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
.login-screen {
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
