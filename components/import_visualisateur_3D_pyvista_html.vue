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

function onSliderChange() {
  // Ici tu peux mettre à jour un overlay, un texte, etc.
  // Exemple : envoyer la valeur à un back pour un vrai slicing
  console.log('Plan Z simulé à :', zValue.value)
}


</script>

<template>
  <!-- <iframe v-if="iframeSrc" :src="iframeSrc" class="iframe-container"></iframe> -->

  <div style="position: relative; width: 800px; height: 600px;">
    <!-- Iframe PyVista -->
    <iframe v-if="iframeSrc" :src="iframeSrc" class="iframe-container"></iframe>

    <!-- Overlay du slider -->
    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); 
                background: rgba(0,0,0,0.6); padding: 10px; border-radius: 5px; color: white;">
      <input type="range" min="0" max="10" step="0.1" v-model="zValue" @input="onSliderChange" />
      <span>Z = {{ zValue }}</span>
    </div>

    <!-- Overlay indicateur -->
    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 5px; border-radius: 5px; color: white;">
      Plan de coupe simulé
    </div>
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 80vh;
  border: none;
}
</style>