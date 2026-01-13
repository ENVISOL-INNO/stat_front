<template>
  <MenusStatsNavDrawer />

  <div>
    <v-card>
      <v-card-text>
        <!-- Maybe this should be hidable? -->
        <h1>Bienvenue sur l'interface pour l'analyse exploratoire de données !</h1>
        Le fichier donné sera traité comme suit :<br>
        - "nd", "<" sont transformés en 0<br>
          - "na" et "-" sont considérés comme non analysé<br>
          Tout autre texte ("non analysé" par exemple) n'est pas pris en compte et faussera les résultats !<br>
      </v-card-text>
    </v-card>
  </div>

  <!-- <div>
        <VFileInput v-model="files" label="Selectionner fichier"></VFileInput>
      </div> -->

  <div>
    <File_import> </File_import>
  </div>
  <div v-if="storeNav.show_stat_formulaire">
    <Formulaire_stats_de_base v-bind:data="store.data_csv"></Formulaire_stats_de_base>
  </div>
  <!-- <div v-if="storeNav.show_stat_formulaire">
    <FormulaireGeneralise name="swarmplot" endpoint_name="/EDASwarmPlot" :champs=list_champ_swarmplot :data="store.data_csv"></FormulaireGeneralise>
  </div> -->

  <div v-if="storeNav.show_swarmplot">
    <FormulaireGeneralise name="Swarmplot" endpoint_name="/EDASwarmPlot" :champs=list_champ_swarmplot store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_boxplot">
    <FormulaireGeneralise name="Boxplot" endpoint_name="/EDABoxPlot" :champs=list_champ_boxplot store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_freq_cum">
    <FormulaireGeneralise name="Fréquences cumulées" endpoint_name="/FreqCum" :champs=list_champ_freq_cum store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <div v-if="storeNav.show_hist">
    <FormulaireGeneralise name="Histogramme" endpoint_name="/EDAHistogram" :champs=list_champ_histo store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
  <!-- <div v-if="storeNav.show_freq_cum && mode == 'spectro'">
    <FormulaireGeneralise name="visualisation grid" endpoint_name="/VisGrid" :champs=list_champ_visgrid store_name="MyData_and_resultsStore"></FormulaireGeneralise>
  </div>
   <-- SWAG API -->
  <div v-if="storeNav.show_modelling && mode == 'spectro'">
    <FormulaireGeneralise name="Modélisation" endpoint_name="/ModelisationAuto" :champs=list_champ_Modelling store_name="MyData_and_resultsStore"></FormulaireGeneralise>
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
  {label: "Unité", name: "unit", type_of_params: "string", value: "mg/kg"}
])
const list_champ_visgrid : Ref<Array<Champ>> = ref([
  {label: "Taille d'une cellule séparées par un espace ", name: "spacing", type_of_params: "num_list", value: ""},
])

// --- SWAG API ---

const list_champ_Modelling : Ref<Array<Champ>> = ref([
  {label: "Polygone : x | y | z "            , name: "polygon"               , type_of_params: "string"  , value: ""},
  {label: "Code EPSG"                        , name: "inproj"                , type_of_params: "num"     , value: 0},
  {label: "Orientation Z"                    , name: "depth_in"              , type_of_params: "string"  , value: "relative"},
  {label: "Grille : Zmin, Zmax"              , name: "grid_zmin_zmax"        , type_of_params: "num_list", value: [0, 0]},
  {label: "Grille : dim. X, dim. Y, dim. Z"  , name: "grid_steps"            , type_of_params: "num_list", value: [5, 5, 1]},
  {label: "Modélisation : Paramètre modélisé", name: "model_parameter"       , type_of_params: "col"     , value: ""},
  {label: "Modelisation : Valeur seuil"      , name: "model_threshold"       , type_of_params: "num"     , value: 0},
])
       
</script>