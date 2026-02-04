<template>
  <div>
      <v-btn color="primary" @click="downloadBlob"> Enregistrer sous </v-btn>
  </div>
</template>

<script lang="ts" setup>
import * as PaPa from 'papaparse';
console.log(10, "in blob")

let props_from_parent = defineProps({
  data_str: {
    type: String,
    // required: true,
  },
  data: {
    type: Array,
    // required: true,
  },
  filename: {
    type: String,
    required: true,
  }
});

console.log(27, "in blob")

/**
 * Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
 function downloadBlob() {
  console.log("props_from_parent.data", props_from_parent.data);
  const content = arrayToCsv(props_from_parent.data);
  console.log("content", content);
  // Fixed content type for now
  const contentType = 'text/csv;charset=utf-8;'
  var BOM = "\uFEFF";                               // this tells excel to read accents characters correctly
  var csvContent = BOM + content;
  // Create a blob
  var blob = new Blob([csvContent], { type: contentType });
  var url = URL.createObjectURL(blob);

  // Create a link to download it
  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', props_from_parent.filename);
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
}

</script>

<style>

</style>