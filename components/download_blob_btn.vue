<template>
  <div>
      <v-btn color="primary" @click="downloadBlob"> Enregistrer sous </v-btn>
    
  </div>
</template>

<script lang="ts" setup>
let props_from_parent = defineProps({
  status_post: {
        type: Boolean,
        required: true,
  }
});
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
  // order 

  const content = arrayToCsv(json_basic_stats);
  
  // fixed filename for now
  const filename = 'export_statistiques_de_base.csv'

  // Fixed content type for now
  const contentType = 'text/csv;charset=utf-8;'
  var BOM = "\uFEFF";                               // this tells excel to read é è à characters correctly
  var csvContent = BOM + content;
  // Create a blob
  var blob = new Blob([csvContent], { type: contentType });
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

<style>

</style>