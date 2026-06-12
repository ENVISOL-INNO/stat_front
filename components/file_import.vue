<template>
  <div>
    <VFileInput v-model="files" label="Selectionner fichier"></VFileInput>
  </div>
  <div v-if="weird_colonnes.length != 0">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>Alertes : {{weird_colonnes.length}}</v-expansion-panel-title>
        <v-expansion-panel-text>
          Les colonnes listées contiennent à la fois du texte et des nombres. Si vous les reconnaissez comme des colonnes textes
          (nom des sondages par exemple) vous pouvez ignorer ce message.
          Si ces colonnes ne devraient contenir que des nombres (des concentrations par exemple), 
          il est possible qu'elles contiennent du texte non pris en compte par le traitement.
          Si c'est le cas, les statistiques et figures concernant ces colonnes seront faussées.<br><br>Veulliez vérifier le fichier d'entrée.<br><br>
          Colonnes potentiellement problématiques :
          <div v-for="c in weird_colonnes">
            - {{c['col_name']}}
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>

</template>

<script lang="ts" setup>
import * as PaPa from 'papaparse';
import { useMyData_and_resultsStore } from '~/stores/data_and_results';

const runtimeConfig = useRuntimeConfig();
const bck_end_base_url_ = runtimeConfig.public.backend_url_public;

const store = useMyData_and_resultsStore();

const files = ref([]);
const weird_colonnes = ref([])

watch(files, Read_File);


async function Read_File() {
  const csv_file = files.value;
  console.log("file in file_import", csv_file);
  let reader = new FileReader();
  reader.readAsText(csv_file);
  reader.onload = async () => {
    const csv_string: string = reader.result as string;
    const list_to_check = {"x": ["X"], "y": ["Y"], "z": ["Z", "prof", "Prof", "profondeur"], "drillhole": ["Drillhole", "Drillholes", "DRILLHOLE", "DRILLHOLES"]}
    var new_da = csv_string;
    for (const [key, value] of Object.entries(list_to_check)) {
      for(const v of value) {
        new_da = new_da.replaceAll(v, key)
      }
    }
    const new_data_csv = PaPa.parse(new_da, { delimiter: ";", header: true, skipEmptyLines: true }).data;
    console.log("new_data_csv", new_data_csv);
    store.set_data_csv(new_data_csv);
    const parser = PaPa.parse(csv_string, { delimiter: ";" });
    const new_colonnes = parser.data[0] as [string];
    store.set_colonnes(new_colonnes);

    const { data, status } = await useFetch(bck_end_base_url_+'/QAQCImport', {
      method: 'POST',
      body: {"dataframe": store.data_csv},
      onResponse({ request, response, options }) {
        weird_colonnes.value = response._data["mixed_type_columns"];
        store.set_colonnes_mixes(response._data["mixed_type_columns"].map((d : any) => d["col_name"]))
      },
      onResponseError({ request, response, options }) {
        // Handle the response errors
      }
    });
  }
}

</script>
