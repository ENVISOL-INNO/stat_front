<script setup>
import { ref, onMounted } from 'vue'
let props_from_parent = defineProps({
  htmlContent: {
    html: String,
    required: true,
  },});

const iframeSrc = ref(null)
const zValue = ref(0)  // valeur du slider

watch(
  () => props_from_parent.htmlContent,
  (newHtml) => {
    if (!newHtml) return

    // Ajout d’un <base> pour les chemins relatifs dans le HTML
    const htmlWithBase = newHtml.replace(
      '<head>',
      `<head><base href="${window.location.origin}/" />`
    )

    // Création du Blob à partir de la chaîne HTML
    const blob = new Blob([htmlWithBase], { type: 'text/html' })
    iframeSrc.value = URL.createObjectURL(blob)
  },
  { immediate: true }
)
</script>

<template>
  <!-- <iframe v-if="iframeSrc" :src="iframeSrc" class="iframe-container"></iframe> -->

  <div style="position: relative; width: 800px; height: 600px;">
    <!-- Iframe PyVista -->
    <iframe v-if="iframeSrc" :src="iframeSrc" class="iframe-container"></iframe>
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 80vh;
  border: none;
}
</style>