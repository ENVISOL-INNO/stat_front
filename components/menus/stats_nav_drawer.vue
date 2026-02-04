<template>
  <v-navigation-drawer>
    <v-list v-model:opened="open">
      <v-list-group value="Stats">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Statistiques"
            prepend-icon="mdi-chart-bar"
          ></v-list-item>
        </template>
          
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
      </v-list-group>  
      <v-list-group  value="Modélisation">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Modélisation"
            prepend-icon="mdi-earth"
          ></v-list-item>
        </template>
        <v-list-item>
          <v-switch v-model="storeNav.show_modelling" color="primary" label="Modélisation"></v-switch>
        </v-list-item>
        <v-list-item>
          <v-switch v-model="storeNav.show_bm" color="primary" label="Bilan massique"></v-switch>
        </v-list-item>
        <v-list-item>
          <v-switch v-model="storeNav.show_calc_vol" color="primary" label="Calcul de volumes"></v-switch>
        </v-list-item>
      </v-list-group>  
    </v-list>
    <!-- <v-switch v-model="mode_spectro" color="primary" label="Spectro"></v-switch> -->
  </v-navigation-drawer>
</template>

<script setup lang="ts">

import { useMyNavStore } from '#build/imports';
const storeNav = useMyNavStore();
const stats_open = ref(true);
const modelisation_open = ref(false);
const open = ref(['Users'])
// let show_stat_formulaire = ref(true)
// let show_swarmplot = ref(false)
// let show_boxplot = ref(false)
</script>
