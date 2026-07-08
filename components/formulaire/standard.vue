<template>
  <h1>{{ name }}</h1>
  <div v-for="i in array_of_champs.length">
    <div v-if="array_of_champs[i - 1][0].type_of_params == 'label'">
      <h2>{{champs[i - 1].label}}</h2>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'col_list'">
      <v-select v-model="array_of_champs[i - 1][1].value" :items="store.colonnes" :label="champs[i - 1].label" :rules="[rules.col_num]" multiple clearable></v-select>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'num'">
      <v-text-field v-model="array_of_champs[i - 1][1].value" :label="champs[i - 1].label" type="number"></v-text-field>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'col'">
      <v-select v-model="array_of_champs[i - 1][1].value" :items="store.colonnes" :label="champs[i - 1].label" :rules="[rules.col_num]" clearable></v-select>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'num_list'">
      <v-text-field v-model="array_of_champs[i - 1][1].value" :rules="[rules.num_list]" :label="champs[i - 1].label"></v-text-field>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'string'">
      <v-text-field v-model="array_of_champs[i - 1][1].value" :label="champs[i - 1].label"></v-text-field>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'file'">
      <VFileInput v-model="array_of_champs[i - 1][1].value" :label="champs[i - 1].label"></VFileInput>
    </div>
    <div v-else-if="array_of_champs[i - 1][0].type_of_params == 'txt_list'">
      <v-select v-model="array_of_champs[i - 1][1].value" :items="Object.keys(champs[i - 1].options)" :label="champs[i - 1].label" clearable></v-select>
    </div>
    <div v-else>
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!! ERREUR le champs marche pas !!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    </div>
  </div>
  <div>
    <v-btn color="primary" @click="post_form">Go</v-btn>
    <v-progress-circular v-if="status_post == 'pending'" color="green" indeterminate></v-progress-circular>
    <div v-if="res_from_post != '' && status_post != 'pending' && bool_file_to_download">
      <DownloadBlobBtn :data="file_to_download" :filename="filename" />
      <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
    </div>
  </div>
  <div v-if="status_post == 'error'">
    {{ error_text }}
  </div>
  <div v-if="res_from_post != '' && status_post != 'pending' && bool_img">
    <NuxtImg v-bind:src="`data:image/jpg;base64,${res_from_post}`" />
    <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
  </div>
  <div v-if="headers.length > 0 && status_post != 'pending'">
    <v-data-table :headers="headers" :items="json_table"></v-data-table>
  </div>
</template>

<script lang="ts" setup>
import { useMyData_and_resultsStore, useMySpectraStore, Resultat } from '~/stores/data_and_results';
import type { ParameterMap, Parameter } from '~/stores/data_and_results';
import { format_param } from '#imports';
import * as PaPa from 'papaparse';

export interface Champ extends Parameter {
  label: string,
  name: keyof ParameterMap,
  options?: Object,           // this should be a dict with both the option and its name in backend
  processing?: Function
}

let props_from_parent = defineProps({
  store_name: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  endpoint_name: {
    type: String,
    required: true,
  },
  backend: {
    type: String,
    required: true,
  },
  champs: {
    type: Array<Champ>,
    required: true,
  }
});

// Get store
const store = useMyData_and_resultsStore();
if (props_from_parent.store_name == "MySpectraStore") {
  const store = useMySpectraStore();   // TODO select store from parent rather than its name
}

// Prep the parameters so we can get the relevant results from the store or init them
const parameters: ParameterMap = {};
for (let i = 0; i < props_from_parent.champs.length; i++) {
  let champ: Champ = props_from_parent.champs[i];
  let name: keyof ParameterMap = champ.name as string;
  parameters[name] = { "type_of_params": champ.type_of_params, "value": champ.value }
}

const init_form = store.get_relevant_resultat(props_from_parent.endpoint_name, parameters);
const init_form_params = init_form.parameters;
// console.log("init_form_params", init_form_params)

// TODO: make this type from Parameter value types
let array_of_champs: Ref<Array<[Champ, Ref<string | string[] | number | number[] | File[]>]>> = ref([])


// Prep the array of ref for the html template
for (let i = 0; i < props_from_parent.champs.length; i++) {
  let champ: Champ = props_from_parent.champs[i];
  let name: keyof ParameterMap = champ.name as string;
  // console.log(champ);
  // console.log(init_form_params[name as keyof ParameterMap].value);
  array_of_champs.value.push([champ, ref(init_form_params[name as keyof ParameterMap].value)]);
}


// Post
const runtimeConfig = useRuntimeConfig();
const bck_end_base_url_ = props_from_parent.backend == "" ? runtimeConfig.public.backend_url_public : props_from_parent.backend;
const status_post = ref("");
const error_text = ref("")

const res_from_post: Ref<string | string[]> = ref(init_form.result);    // TODO should accept other types of results


let bool_img: Ref<boolean> = ref(false)
let bool_file_to_download: Ref<boolean> = ref(false)
let file_to_download: Ref<Array<string>> = ref([""])
let filename: Ref<string> = ref("")
let headers: Ref<{ title: string, value: string }[]> = ref([]);
let json_table = ref([]);

function deal_with_response(res: any) {
  // console.log("res");
  // console.log(res);
  // console.log(res["df"]);
  // console.log(typeof(res));
  if (res['fig'] !== undefined) {
    console.log("yooo");
    bool_img.value = true;
    return res['fig']
  } else if (res['modelisation'] !== undefined) {
    bool_file_to_download.value = true;
    const string_array: string = res['modelisation']['kriging']['carto3D'];
    const arrayyyy: Array<string> = JSON.parse(string_array);
    file_to_download.value = arrayyyy;

    filename.value = "modelisation"
    return arrayyyy
  } else if (res['df'] !== undefined) {
    bool_file_to_download.value = true;
    const arrayyyy: Array<string> = res['df'];
    file_to_download.value = arrayyyy;
    filename.value = props_from_parent.name;
    json_table.value = res["df"]
    console.log("yes it's truuuue", res["cols_in_order"])
    if (res["cols_in_order"] !== undefined) {
      headers.value = res["cols_in_order"].map((c: string) => { return { "title": c, "value": c } })
      console.log("and i owe it all to you", headers.value)
    }
    return arrayyyy
  } else {
    console.log("jhsdssfskj")
    return ''
  }
}


async function post_form() {
  var body_json: { [id: string]: unknown } = {}
  var body_params_only: ParameterMap = {}

  for (let i = 0; i < props_from_parent.champs.length; i++) {
    const c = await format_param(array_of_champs.value[i][0], array_of_champs.value[i][1].value)
    console.log("ch", i, array_of_champs.value[i][0].name, array_of_champs.value[i][0].value, array_of_champs.value[i][1].value)
    body_params_only[array_of_champs.value[i][0].name] = { type_of_params: array_of_champs.value[i][0].type_of_params, value: array_of_champs.value[i][1].value }
    if(array_of_champs.value[i][0].type_of_params != "label") {
      console.log("ch", i, array_of_champs.value[i][0].name)
      body_json[array_of_champs.value[i][0].name] = c
    }
  }
  console.log("choke me", body_json)
  body_json["dataframe"] = store.data_csv
  
  const { data: res, status } = await useFetch(bck_end_base_url_ + props_from_parent.endpoint_name, {
    method: 'POST',
    body: body_json,
    onRequest({ }) {
      console.log("hey")
      file_to_download.value = ['']
      status_post.value = "pending";
    },
    onResponse({ request, response, options }) {
      res_from_post.value = deal_with_response(response._data);    // TODO: this should also work when the endpoint does not return a fig

      const res = new Resultat(
        props_from_parent.endpoint_name,
        body_params_only,
        response._data["fig"],
        response._data["name_fig"]
      );
      status_post.value = "done"
      store.add_result(res);
    },
    onRequestError({ request, response, options }) {
      // Handle the response errors
      console.log("onRequestError", request)
      status_post.value = "error";
      error_text.value = "Erreur, vérifier vos paramètres d'entrée";
    },
    onResponseError({ request, response, options }) {
      // Handle the response errors
      console.log("onResponseError");
      status_post.value = "error";
      console.log(response._data);

      error_text.value = "Erreur, vérifier vos paramètres d'entrée, notemment que les colonnes choisies ne figure pas parmis les colonnes problématiques identifiées par le site. (message du code : " + response._data
    }
  });
};

// clean up of params and results if new file is selected
watch(() => store.data_csv, () => { reset_everything() });
function reset_everything() {
  for (let i = 0; i < props_from_parent.champs.length; i++) {
    array_of_champs.value[i][1].value = props_from_parent.champs[i].value
  };
  res_from_post.value = ""
  bool_file_to_download.value = false
  bool_img.value = false
}

const rules = {
  num : (v: string) => /^[+-]?(\d*\.)?\d*$/.test(v) || "Format attendu : nombres (avec . en séparateur décimal)",
  int : (v: string) => /^[+-]?(\d)+$/.test(v) || "Format attendu : nombre entier",
  num_list: (v: string) => /^((\d*\.)?\d*\s)*(\d*\.)?\d*$/.test(v) || "Format attendu : nombres (avec . en séparateur décimal) séparés d'un espace",
  col_num : (v : string) => !store.colonnes_mixes.includes(v) || "Colonne ne contient pas que des nombres",
  falssse: (v: string) => false || "Format attendu : nombres séparés d'un espace"
}
</script>

<style></style>