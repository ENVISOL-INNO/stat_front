<template>
  <MenusStatsNavDrawer />
    <h1>Vous voulez :</h1>

    <v-expansion-panels multiple>
      <v-expansion-panel>
        <v-expansion-panel-title><h2>Faire des stats</h2></v-expansion-panel-title>
        <v-expansion-panel-text>
          Le fichier attendu contient :<br>
          - des colonnes avec les noms, concentrations mesurées, lithologies (etc.) des échantillons<br>
          - des lignes avec les échantillons<br><br>
          
          Il sera traité comme suit :<br>
          - les "nd", "<" sont transformés en 0<br>
          - les "na" et "-" sont considérés comme non analysés<br>
          Tout autre texte ("non analysé" par exemple) n'est pas pris en compte et faussera les résultats !
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><h2>Exploiter un modèle géostats</h2></v-expansion-panel-title>
        <v-expansion-panel-text>
          Le fichier attendu doit contenir :<br>
          - les colonnes x, y, et z (il faut que ces noms soient respectés)<br>
          - des colonnes avec les concentrations modélisées
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  <br>
  <!-- <div>
    <v-card>
      <v-card-text>
        <h1>Bienvenue sur l'interface pour l'analyse exploratoire de données !</h1>
        Le fichier donné sera traité comme suit :<br>
        - "nd", "<" sont transformés en 0<br>
          - "na" et "-" sont considérés comme non analysé<br>
          Tout autre texte ("non analysé" par exemple) n'est pas pris en compte et faussera les résultats !<br>
      </v-card-text>
    </v-card>
  </div> -->

  <!-- <div>
        <VFileInput v-model="files" label="Selectionner fichier"></VFileInput>
      </div> -->

  <div>
    <File_import> </File_import>
  </div>
  <div padding="100px" v-if="storeNav.show_stat_formulaire">
    <Formulaire_stats_de_base v-bind:data="store.data_csv"></Formulaire_stats_de_base>
  </div>

  <div v-if="storeNav.show_swarmplot">
    <FormulaireGeneralise name="Swarmplot" backend="" endpoint_name="/EDASwarmPlot" :champs=list_champ_swarmplot store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_boxplot">
    <FormulaireGeneralise name="Boxplot" backend="" endpoint_name="/EDABoxPlot" :champs=list_champ_boxplot store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_freq_cum">
    <FormulaireGeneralise name="Fréquences cumulées" backend="" endpoint_name="/FreqCum" :champs=list_champ_freq_cum store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_hist">
    <FormulaireGeneralise name="Histogramme" backend="" endpoint_name="/EDAHistogram" :champs=list_champ_histo store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_modelling && mode == 'spectro' && mode == 'spectro'">
    <FormulaireGeneralise name="Modélisation" :backend=backeng_url_swag endpoint_name="/modelisation_auto" :champs=list_champ_modelling store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_bm">
    <FormulaireGeneralise name="Bilan massique" :backend=backeng_url_swag endpoint_name="/masse_volume_analysis_table" :champs=list_champ_bm store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_calc_vol">
    <FormulaireGeneralise name="Calculs de volume" :backend=backeng_url_swag endpoint_name="/access_volume_analysis_table" :champs=list_champ_calc_vol store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>

</template>

<script setup lang="ts">

import { useMyData_and_resultsStore } from '~/stores/data_and_results';
import { useMyNavStore } from '~/stores/nav';
import Formulaire_stats_de_base from '~/components/formulaire_stats_de_base.vue';
import File_import from '~/components/file_import.vue';
import type { Champ } from './formulaire_generalise.vue';

const mode = useRuntimeConfig().public.mode;
const store = useMyData_and_resultsStore();
const storeNav = useMyNavStore();
const backeng_url_swag = useRuntimeConfig().public.backend_swag_url_public;


const list_champ_histo : Ref<Array<Champ>> = ref([
  {label: "Élément à analyser", name: "nom_elem", type_of_params: "col", value: ""},
  {label: "Concentrations séparées par un espace (ex. 0 200 1000) (si vide des valeurs automatiques seront déterminé)", name: "bins", type_of_params: "num_list", value: ""},
  {label: "Unité", name: "unit", type_of_params: "string", value: "mg/kg"}
])
const list_champ_freq_cum : Ref<Array<Champ>> = ref([
  {label: "Élément à analyser", name: "nom_elem", type_of_params: "col", value: ""},
  {label: "Colonne avec les noms d'échantillon", name: "nom_id_sample", type_of_params: "col", value: ""},
  {label: "Nombre d'étiquette d'échantillon à afficher", name: "number_of_samples_to_show", type_of_params: "num", value: 0},
  {label: "Unité", name: "unit", type_of_params: "string", value: "mg/kg"}
])
const list_champ_swarmplot : Ref<Array<Champ>> = ref([
  {label: "Élément à analyser", name: "nom_elem", type_of_params: "col", value: ""},
  {label: "Catégorie à analyser", name: "nom_classifier", type_of_params: "col", value: ""},
  // {label: "Unité", name: "unit", type_of_params: "string", value: "mg/kg"}
])
const list_champ_boxplot : Ref<Array<Champ>> = ref([
  {label: "Somme à analyser", name: "sum_element", type_of_params: "col", value: ""},
  {label: "Éléments dans la somme à analyser", name: "list_elements", type_of_params: "col_list", value: []},
  // {label: "Concentrations séparées par un espace (ex. 0 200 1000) (si vide des valeurs automatiques seront déterminé)", name: "concentration_threshold_list_table", type_of_params: "num_list", value: ""},
  {label: "Unité", name: "unit", type_of_params: "string", value: "mg/kg"}
])
// const list_champ_visgrid : Ref<Array<Champ>> = ref([
//   {label: "Taille d'une cellule séparées par un espace ", name: "spacing", type_of_params: "num_list", value: ""},
// ])

// --- SWAG API ---


const list_champ_modelling : Ref<Array<Champ>> = ref([
  // {label: "Polygone : x | y | z "            , name: "polygon"               , type_of_params: "string"  , value: ""},
  {label: "Paramètre à modélisé"             , name: "model_parameter"       , type_of_params: "col"     , value: ""},
  {label: "Colonne avec nom ech."            , name: "drillhole_col_name"    , type_of_params: "col"  , value: ""},
  {label: "Grille de modélisation : taille de la cellule élémentaire en x en y en z séparées par un espace"    , name: "grid_steps"            , type_of_params: "num_list", value: "5 5 1"},
])

// const list_champ_modelling : Ref<Array<Champ>> = ref([
//   // {label: "Polygone : x | y | z "            , name: "polygon"               , type_of_params: "string"  , value: ""},
//   {label: "Paramètre à modélisé"             , name: "model_parameter"       , type_of_params: "col"     , value: ""},
//   {label: "Colonne avec nom ech."            , name: "drillhole_col_name"    , type_of_params: "col"  , value: ""},
//   {label: "Modelisation : Valeur seuil"      , name: "model_threshold"       , type_of_params: "num"     , value: 0},
//   {label: "Grille de modélisation : taille de la cellule élémentaire en x en y en z séparées par un espace"    , name: "grid_steps"            , type_of_params: "num_list", value: "5 5 1"},
//   {label: "Grille : Zmin, Zmax"              , name: "grid_zmin_zmax"        , type_of_params: "num_list", value: "0 1"},
//   {label: "Z est exprimé en :"               , name: "depth_in"              , type_of_params: "string"  , value: "relative"},
//   {label: "Système de géoréférencement : code EPSG"                          , name: "inproj"                , type_of_params: "num"     , value: 2154},
// ])

const list_champ_bm : Ref<Array<Champ>> = ref([
  // {label: "Fichier avec grille", name: "grid_df", type_of_params: "file", value: ""},
  {label: "taille de la cellule élémentaire en x en y en z séparées par un espace", name: "grid_steps", type_of_params: "num_list", value: "5 5 1"},
  {label: "Paramètre modélisé", name: "sim_str_identifier", type_of_params: "col", value: ""},
  {label: "Densité sol", name: "soil_density", type_of_params: "num", value: 1.8},
  {label: "Concentrations séparées par un espace (ex. 0 200 1000) (si vide des valeurs automatiques seront déterminé)", name: "concentration_threshold_list_table", type_of_params: "num_list", value: ""},
  {label: "Valeur de fond", name: "concentration_threshold_background", type_of_params: "num", value: 0.2},
])

const list_champ_calc_vol : Ref<Array<Champ>> = ref([
  // {label: "Fichier avec grille", name: "grid_df", type_of_params: "file", value: ""},
  {label: "taille de la cellule élémentaire en x en y en z séparées par un espace", name: "grid_steps", type_of_params: "num_list", value: "5 5 1"},
  {label: "Paramètre modélisé", name: "pollutants_names", type_of_params: "col_list", value: []},
  {label: "Valeur min.", name: "pollutants_min_values", type_of_params: "num_list", value: "0"},
  {label: "Valeur max.", name: "pollutants_max_values", type_of_params: "num_list", value: "999999999"},
  {label: "Z est exprimé en :", name: "mode_z", type_of_params: "txt_list", value: "relativ", options: ["relativ", "mNGF"]},
])

</script>