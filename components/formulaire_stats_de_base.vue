<template>
    <h1> Statistiques de base</h1>
    <div>
      <div v-if="status_post">
        <v-progress-circular v-if="status_post == 'pending'"
          color="green"
          indeterminate
        ></v-progress-circular>
      </div>
      <v-btn color="primary" @click="post_stats_de_base"> Statistiques de base </v-btn>
      <v-btn v-if="status_post" color="primary" @click="downloadBlob"> Enregistrer sous </v-btn>
    </div>
    <div v-if="json_table_basic_stats != undefined && status_post && status_post != 'pending'">
      <v-data-table :headers="headers_from_back" :items="json_table_basic_stats"></v-data-table>
    </div>
</template>

<script setup lang="ts">
import * as PaPa from 'papaparse';
// import * as xlsx from 'xlsx';
// import * as fs from 'fs';

const runtimeConfig = useRuntimeConfig()
const bck_end_base_url_ = runtimeConfig.public.backend_url_public;

let status_post = ref("");

// This is kept to have an exemple of how to pass properties to a component. in the rest of the code, a store is used.

// This is definition of the parameters that parent component can pass to this component.
// The type definition should be one of these: String, Number, Boolean, Array, or Object
// If these need to be dynamic (if they change in the parent, they change in the child), they should be passed with the "v-bind" keyword (see index.vue)
// also in the child component (here) the prop needs to be accessed from the props_from_parent object
// for instance in the parent this component in used like this: <Stats_de_base v-bind:data="data_csv"></Stats_de_base>
let props_from_parent = defineProps({
    data: {
        type: Array,
        required: true,
    },
});

let headers_from_back = ref([]);
let json_table_basic_stats = ref([]);
let json_colonnes_dict = ref([]);

async function post_stats_de_base() {
  const { data: res, status } = await useFetch(bck_end_base_url_+'/BasicStatistics', {
    method: 'POST',
    body: {"dataframe": props_from_parent.data},
    onRequest({ request, options }) {
        console.log("props_from_parent.data", props_from_parent.data);
    },
    onResponse({ request, response, options }) {
      console.log("response._data", response._data);
      let colonnes_dict = response._data["colonnes_dict"];
      console.log("colonnes_dict", colonnes_dict);
      colonnes_dict = colonnes_dict.sort((a: { pos: number; }, b: { pos: number; }) => {return a.pos - b.pos});
      json_colonnes_dict.value = colonnes_dict;
      headers_from_back.value = colonnes_dict.map(({nv_nom, nom}) => {return {title: nv_nom, value: nom}});
      console.log("headers_from_back", headers_from_back);
      json_table_basic_stats.value = response._data["list_stats"]
    },
    onResponseError({ request, response, options }) {
      console.log(116, "this bugged:", response)
      // Handle the response errors
    }
  });
  status_post.value = status.value
};



/**
 * Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
 function downloadBlob() {
  // fixed content for now
  // create json object from json_table_basic_stats.value with keys from json_colonnes_dict.value
  const json_basic_stats = json_table_basic_stats.value.map((item) => {
    const newItem = {};
    json_colonnes_dict.value.forEach((col) => {
      newItem[col.nv_nom] = item[col.nom];
    });
    return newItem;
  });
  const content = arrayToCsv(json_basic_stats);
  
  // fixed filename for now
  const filename = 'export_statistiques_de_base.csv'

  // Fixed content type for now
  const contentType = 'text/csv;charset=utf-8;'

  // Create a blob
  var blob = new Blob([content], { type: contentType });
  var url = URL.createObjectURL(blob);

  // Create a link to download it
  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
};


/**
 * Convert a 2D array into a CSV string
 */
 function arrayToCsv(data){
  console.log("data in array to csv", data);
  let unparsed_data = PaPa.unparse(data, {delimiter: ";"});
  console.log("unparsed_data", unparsed_data);
  return unparsed_data
  // return data.map(row =>
  //   row
  //   .map(String)  // convert every value to String
  //   .map(v => v.replaceAll('"', '""'))  // escape double quotes
  //   .map(v => `"${v}"`)  // quote it
  //   .join(',')  // comma-separated
  // ).join('\r\n');  // rows starting on new lines
}






</script>