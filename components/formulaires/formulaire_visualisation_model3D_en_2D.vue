<template>
  <h1> Visualisation du modèle </h1> 

  <v-select v-model="value_to_model" :items="store.colonnes" label="Composé à visualiser"> </v-select>
  <v-text-field v-model="inproj" label="SCR du projet" ></v-text-field>
  <v-btn color="primary" @click="post_model"> Charger les données </v-btn>

  <div v-if="status_post">
    <v-progress-circular v-if="status_post === 'pending'"
      color="primary" size="50" width="12"
      indeterminate
    ></v-progress-circular>
  </div>
  
  <div v-if="status_post == 'error'">
      Erreur !
      Ceci est probablement du a la présence de texte dans les colonnes sélectionnées. Vérifiez si elles sont inclues dans les alertes ci dessus et corrigez le fichier d'entré en conséquence.
      <!-- Status = {{status_post}} {{ typeof(status_post.value) }} {{ status_post.value == 'pending' }} -->
    </div>

  <div v-if="img_visual != '' && status_post != 'pending'">
    <h2> Résultat de visualisation</h2>
    <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" :src="`data:image/jpg;base64,${img_visual}`" />
    <!-- <v-data-table :headers="headers_from_back" :items="json_3Dmodelling_coordinates"></v-data-table> -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMyData_and_resultsStore, Resultat } from '#build/imports';
import * as PaPa from 'papaparse';

const runtimeConfig = useRuntimeConfig();
const bck_end_base_url_hrk = runtimeConfig.public.backend_url_public_hrk;
const store = useMyData_and_resultsStore();
const endpoint_name = "/3Dmodelling_in2D" // ??? what name using in backend

const status_post = ref<string>('');

const value_to_model = ref("")
const inproj = ref<number>();
const init_visual = store.get_relevant_resultat(endpoint_name) ;
const img_visual = ref(init_visual.result)
const init_visual_params = init_visual.parameters ;
let headers_from_back = ref(init_visual_params.visual_element);
let json_3Dmodelling_coordinates = ref([]);

async function post_model() {
  const maskdata = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const extension = [-205834.0, -205690.0, 6.0, 316999.0, 317089.0, 6.0, 0.0, 0.0, 5.0];
  const threshold = 500;
  // const { data, status } = await useFetch(bck_end_base_url_swag_ + "/prepare_post_ds_swag", {
  //   method: 'POST',
  //   body: {
  //     "dataframe": store.data_csv,
  //     "inproj": inproj.value
  //   },
  //   onRequest({}) {
  //     status_post.value = "pending";
  //   },
  //   onResponse({ request, response, options }) {
  //     const maskdata = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //     const extension = [-205834.0, -205690.0, 6.0, 316999.0, 317089.0, 6.0, 0.0, 0.0, 5.0],
  //     const threshold = response._data["threshold"]
  //   },
  //   onResponseError({ request, response, options }) {
  //     // Handle the response errors
  //     console.log("ERROR in post model: ", response);
  //     status_post.value = "error"
  //   }
  // });
  const { data, status } = await useFetch(bck_end_base_url_hrk + "/cmd_modelisation", {
        method: 'POST',
         body: {"dataframe": store.data_csv,
            "maskdata": maskdata,
            "extension": extension,
            "threshold": threshold},
        onRequest({}) {
          status_post.value = "pending";
        },
        onResponse({ request, response, options }) {
          img_visual.value = response._data["fig"];
          const res = new Resultat(
          endpoint_name,
            { "modelisation_compound_to_visualize": value_to_model.value, "modelisation_projection": inproj.value },
          response._data["modelisation"]["kriging"]["carto3D"],
          "modelisation"
          );
          store.add_result(res);
          status_post.value = "done";
          console.log("87 here in post boxplot")
        },
        onResponseError({ request, response, options }) {
          // Handle the response errors
          console.log("ERROR in post model: ", response);
          status_post.value = "error"
        },
      });
}


watch(() => store.data_csv, () => { reset_everything() });

function reset_everything() {
  value_to_model.value = "";
  inproj.value = 0;
  img_visual.value = "";
}

/**
* Download contents as a file
* Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
*/
function downloadBlob() {
  const content = arrayToCsv(json_3Dmodelling_coordinates.value);
  const filename = 'export_3Dmodelling.csv';
  const contentType = 'text/csv;charset=utf-8;';

  var blob = new Blob([content], { type: contentType });
  var url = URL.createObjectURL(blob);

  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

/**
* Convert a 2D array into a CSV string
*/
function arrayToCsv(data) {
  let unparsed_data = PaPa.unparse(data, { delimiter: ";" });
  return unparsed_data;
}

</script>
