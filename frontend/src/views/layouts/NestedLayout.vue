<script setup lang="ts">
import MainLayout from '@/components/MainLayout.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <MainLayout>
    <router-view :key="route.fullPath" />
  </MainLayout>
</template>
