<script setup>
import { ref, onMounted } from 'vue'
let props_from_parent = defineProps({
  htmlContent: {
    html: String,
    required: true,
  },});

const iframeSrc = ref(null)

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

// onMounted(async () => {
//   //On récupère le fichier .json
//   const res = await fetch('/testHTML.json')
//   const data = await res.json()

//   const htmlWithBase = data.html.replace(
//     '<head>',
//     `<head><base href="${window.location.origin}/" />`
//   )

//   // Création du BLOB nécessaire pour l'affichage dynamique.
//   const blob = new Blob([htmlWithBase], { type: 'text/html' })
//   iframeSrc.value = URL.createObjectURL(blob)
// })



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