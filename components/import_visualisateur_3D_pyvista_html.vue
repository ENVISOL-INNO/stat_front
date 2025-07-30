<script setup>
import { ref, onMounted } from 'vue'

const iframeSrc = ref('')

onMounted(async () => {
  const res = await fetch('/testHTML.json')
  const data = await res.json()

  const htmlWithBase = data.html.replace(
    '<head>',
    `<head><base href="${window.location.origin}/" />`
  )

  const blob = new Blob([htmlWithBase], { type: 'text/html' })
  iframeSrc.value = URL.createObjectURL(blob)
})
</script>

<template>
  <iframe v-if="iframeSrc" :src="iframeSrc" class="iframe-container"></iframe>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 80vh;
  border: none;
}
</style>