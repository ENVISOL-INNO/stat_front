<template>
  <v-navigation-drawer>
    <v-list>
      <v-list-item>
        <v-switch v-model="storeNav.show_stat_formulaire" color="primary" label="Statistiques de base"></v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch v-model="storeNav.show_hist" color="primary" label="Histogramme"></v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch v-model="storeNav.show_freq_cum" color="primary" label="Fréquences cumulées"></v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch v-model="storeNav.show_swarmplot" color="primary" label="Swarmplot"></v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch v-model="storeNav.show_boxplot" color="primary" label="Boxplots"></v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch v-model="storeNav.show_visGrid" color="primary" label="Visualisation 3D"></v-switch>
      </v-list-item>
    </v-list>
    <!-- <v-switch v-model="mode_spectro" color="primary" label="Spectro"></v-switch> -->
  </v-navigation-drawer>
</template>

<script setup lang="ts">

import { useMyNavStore } from '#build/imports';
const storeNav = useMyNavStore();


// let show_stat_formulaire = ref(true)
// let show_swarmplot = ref(false)
// let show_boxplot = ref(false)
</script>
