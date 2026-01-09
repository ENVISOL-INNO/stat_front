<template>
  <h1>{{name}}</h1>
  <div v-for="i in array_of_champs.length">
    <div v-if="array_of_champs[i-1][0].type_of_params == 'col_list'">
      <v-select v-model="array_of_champs[i-1][1].value" :items="store.colonnes" :label="champs[i-1].label" multiple></v-select>
    </div>
    <div v-else-if="array_of_champs[i-1][0].type_of_params == 'num'">
      <v-text-field v-model="array_of_champs[i-1][1].value" :label="champs[i-1].label" type="number"></v-text-field>
    </div>
    <div v-else-if="array_of_champs[i-1][0].type_of_params == 'col'">
      <v-select v-model="array_of_champs[i-1][1].value" :items="store.colonnes" :label="champs[i-1].label"></v-select>
    </div>
    <div v-else-if="array_of_champs[i-1][0].type_of_params == 'num_list'">
      <v-text-field v-model="array_of_champs[i-1][1].value" :label="champs[i-1].label"></v-text-field>
    </div>
    <div v-else-if="array_of_champs[i-1][0].type_of_params == 'string'">
      <v-text-field v-model="array_of_champs[i-1][1].value" :label="champs[i-1].label"></v-text-field>
    </div>
    <div v-else>
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!! ERREUR le champs marche pas !!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    </div>
  </div>
  <v-btn color="primary" @click="post_form">Go</v-btn>
  <!-- {{status_post}} -->
  <div v-if="status_post == 'pending'">
    <!-- brrrr -->
    <v-progress-circular v-if="status_post == 'pending'"
    color="green"
    indeterminate
  ></v-progress-circular>
  </div>
  <div v-if="status_post == 'error'">
    Erreur !
    Ceci est probablement du a la présence de texte dans les colonnes sélectionnées. Vérifiez si elles sont inclues dans les alertes ci dessus et corrigez le fichier d'entré en conséquence.
  </div>

  <div v-if="res_from_post != '' && status_post != 'pending'">
    <NuxtImg v-bind:src="`data:image/jpg;base64,${res_from_post}`" />
    <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
  </div>
</template>

<script lang="ts" setup>
import { useMyData_and_resultsStore, useMySpectraStore, Resultat } from '~/stores/data_and_results';
import type { ParameterMap, Parameter } from '~/stores/data_and_results';
import chiplist from './chiplist.vue';
import Chiplist from './chiplist.vue';
// import type { AllowedParameters, ParameterMap } from '~/stores/data_and_results';

export interface Champ extends Parameter {   // this looks a lot like a Parameter + a label, maybe change the type?
  label: string,
  name: keyof ParameterMap
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
const parameters : ParameterMap = {} ;
for (let i =0; i < props_from_parent.champs.length; i++) {
  let champ : Champ = props_from_parent.champs[i];
  let name : keyof ParameterMap  = champ.name as string;
  parameters[name] = {"type_of_params": champ.type_of_params, "value": champ.value}
}

const init_form = store.get_relevant_resultat(props_from_parent.endpoint_name, parameters);
const init_form_params = init_form.parameters;
console.log("init_form_params", init_form_params)

let array_of_champs : Ref<Array<[Champ, Ref<string | string[] | number | number[]>]>> = ref([])


// Prep the array of ref for the html template
for (let i =0; i < props_from_parent.champs.length; i++) {
  let champ : Champ = props_from_parent.champs[i];
  let name : keyof ParameterMap  = champ.name as string;
  console.log(champ);
  console.log(init_form_params[name as keyof ParameterMap].value);
  array_of_champs.value.push([champ, ref(init_form_params[name as keyof ParameterMap].value)]);
}


// Post
const runtimeConfig = useRuntimeConfig();
const bck_end_base_url_ = props_from_parent.backend == "" ? runtimeConfig.public.backend_url_public : props_from_parent.backend;
console.log("bck_end_base_url_", bck_end_base_url_)
console.log("bck_end_base_url_", props_from_parent.backend == "")
const status_post = ref("");

const res_from_post : Ref<string> = ref(init_form.result);    // TODO should accept other types of results

async function post_form() {

  var body_json: {[id : string]: unknown} = {}
  var body_params_only : ParameterMap = {}

  for (let i = 0; i < props_from_parent.champs.length; i++) {
    if(array_of_champs.value[i][0].type_of_params == "num") {
      body_json[array_of_champs.value[i][0].name] = Number(array_of_champs.value[i][1].value)
      // console.log("heeee", typeof(body_json[array_of_champs.value[i][0].name]))
    } else if (array_of_champs.value[i][0].type_of_params == "num_list") {
      // console.log("heeee", array_of_champs.value[i][1].value)
      var full_string: String = String(array_of_champs.value[i][1].value); // This is a bit unnecessary, it simply unsures that full string is indeed a string
      // console.log("heeee", full_string)
      var list_str = full_string.split(' ');
      // console.log("heeee", list_str)
      body_json[array_of_champs.value[i][0].name] = list_str.map(s => Number(s))
      // console.log("heeee", typeof(body_json[array_of_champs.value[i][0].name]), body_json[array_of_champs.value[i][0].name])
    } else {
      body_json[array_of_champs.value[i][0].name] = array_of_champs.value[i][1].value
    }
    body_params_only[array_of_champs.value[i][0].name] = {type_of_params: array_of_champs.value[i][0].type_of_params, value: array_of_champs.value[i][1].value}
  }
  body_json["dataframe"] = store.data_csv


  const { data: res, status } = await useFetch(bck_end_base_url_ + props_from_parent.endpoint_name, {
    method: 'POST',
    body: body_json,
    onRequest({}){
      status_post.value = "pending";
    },
    onResponse({ request, response, options }) {
      console.log("response._data", response._data);
      res_from_post.value = response._data["fig"];    // TODO: this should also work when the endpoint does not return a fig
      const res = new Resultat(
        props_from_parent.endpoint_name,
        body_params_only,
        response._data["fig"],
        response._data["name_fig"]
      );
      store.add_result(res);
      status_post.value = "done"
    },
    onRequestError({ request, response, options }) {
      // Handle the response errors
      console.log("onRequestError", request)

      status_post.value = "error"
    },
    onResponseError({ request, response, options }) {
      // Handle the response errors
      console.log("onResponseError")
      status_post.value = "error"
    }
  });
};


// clean up ofparams and results if new file is selected
watch(() => store.data_csv, () => { reset_everything() });
function reset_everything() {
  for (let i = 0; i < props_from_parent.champs.length; i++) {
    array_of_champs.value[i][1].value = props_from_parent.champs[i].value
  };
  res_from_post.value = ""
}


</script>

<style>

</style>