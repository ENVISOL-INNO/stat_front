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
    <div v-else-if="array_of_champs[i-1][0].type_of_params == 'file'">
      <VFileInput v-model="array_of_champs[i-1][1].value" :label="champs[i-1].label"></VFileInput>
    </div>
    <div v-else>
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!! ERREUR le champs marche pas !!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    </div>
  </div>
  <v-btn color="primary" @click="post_form">Go</v-btn>
  {{status_post}}
  <div v-if="status_post == 'pending'">
    brrrr
    <!-- <v-progress-circular v-if="status_post == 'pending'"
    color="green"
    indeterminate
  ></v-progress-circular> -->
  </div>
  <div v-if="status_post == 'error'">
    Erreur !
    Ceci est probablement du a la présence de texte dans les colonnes sélectionnées. Vérifiez si elles sont inclues dans les alertes ci dessus et corrigez le fichier d'entré en conséquence.
  </div>

  <div v-if="res_from_post != '' && status_post != 'pending'">
    <NuxtImg v-bind:src="`data:image/jpg;base64,${res_from_post}`" />
    <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
  </div>
  <div v-if="res_from_post != '' && status_post != 'pending' && bool_file_to_download">
    jhk
    
    <DownloadBlobBtn :data="file_to_download" :filename="filename" />
    <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
  </div>
</template>

<script lang="ts" setup>
import { useMyData_and_resultsStore, useMySpectraStore, Resultat } from '~/stores/data_and_results';
import type { ParameterMap, Parameter } from '~/stores/data_and_results';
import * as PaPa from 'papaparse';

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

// TODO: make this type from Parameter value types
let array_of_champs : Ref<Array<[Champ, Ref<string | string[] | number | number[] | File[]>]>> = ref([])


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


let bool_file_to_download : Ref<boolean> = ref(false)
let file_to_download : Ref<Array<string>> = ref([""])
let filename : Ref<string> = ref("")
let file_to_download_ = [""]

function deal_with_response(res: any) {
  console.log(res)
  console.log(typeof(res))
  if ( res['fig'] !== undefined ) {
    console.log("yooo")
    return res['fig']
  }
  else if (res['modelisation'] !== undefined) {
    console.log("iiiiiiiii");
    console.log(res['modelisation']);
    bool_file_to_download.value = true;
    console.log(146);
    const string_array : string = res['modelisation']['kriging']['carto3D'];
    console.log(147);
    const strin_arr : string = "[{\"z\":3.5,\"value\":0.009058,\"x\":1.3373074042,\"y\":48.0687111932},{\"z\":4.5,\"value\":0.0,\"x\":1.3373074042,\"y\":48.0687111932},{\"z\":5.5,\"value\":0.0,\"x\":1.3373074042,\"y\":48.0687111932},{\"z\":6.5,\"value\":0.0,\"x\":1.3373074042,\"y\":48.0687111932},{\"z\":0.5,\"value\":0.206616,\"x\":1.337340469,\"y\":48.0685136444},{\"z\":1.5,\"value\":0.01,\"x\":1.337340469,\"y\":48.0685136444},{\"z\":2.5,\"value\":0.008824,\"x\":1.337340469,\"y\":48.0685136444},{\"z\":3.5,\"value\":0.01,\"x\":1.337340469,\"y\":48.0685136444},{\"z\":5.5,\"value\":0.0,\"x\":1.3373353808,\"y\":48.0686755853},{\"z\":6.5,\"value\":0.0,\"x\":1.3373353808,\"y\":48.0686755853},{\"z\":0.5,\"value\":0.109966,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":1.5,\"value\":0.01,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":2.5,\"value\":0.01,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":3.5,\"value\":0.01,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":4.5,\"value\":0.0,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":5.5,\"value\":0.0,\"x\":1.3373348154,\"y\":48.0686935787},{\"z\":4.5,\"value\":0.0,\"x\":1.3373650534,\"y\":48.068585997},{\"z\":5.5,\"value\":0.0,\"x\":1.3373650534,\"y\":48.068585997},{\"z\":6.5,\"value\":0.0,\"x\":1.3373650534,\"y\":48.068585997},{\"z\":0.5,\"value\":0.01,\"x\":1.337364488,\"y\":48.0686039905},{\"z\":1.5,\"value\":0.260859,\"x\":1.337364488,\"y\":48.0686039905},{\"z\":2.5,\"value\":0.208868,\"x\":1.337364488,\"y\":48.0686039905},{\"z\":3.5,\"value\":0.183374,\"x\":1.337364488,\"y\":48.0686039905},{\"z\":4.5,\"value\":0.006169,\"x\":1.337364488,\"y\":48.0686039905},{\"z\":0.5,\"value\":0.009084,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":1.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":2.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":3.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":4.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":5.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":6.5,\"value\":0.0,\"x\":1.337362792,\"y\":48.0686579708},{\"z\":0.5,\"value\":0.01,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":1.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":2.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":3.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":4.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":5.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":6.5,\"value\":0.0,\"x\":1.3373622266,\"y\":48.0686759642},{\"z\":0.5,\"value\":0.00799,\"x\":1.3373616613,\"y\":48.0686939576},{\"z\":1.5,\"value\":0.0,\"x\":1.3373616613,\"y\":48.0686939576},{\"z\":5.5,\"value\":0.0,\"x\":1.3373935952,\"y\":48.0685323956},{\"z\":6.5,\"value\":0.0,\"x\":1.3373935952,\"y\":48.0685323956},{\"z\":0.5,\"value\":0.0,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":1.5,\"value\":0.002283,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":2.5,\"value\":0.01,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":3.5,\"value\":0.0,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":4.5,\"value\":0.0,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":5.5,\"value\":0.0,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":6.5,\"value\":0.0,\"x\":1.3373930298,\"y\":48.0685503891},{\"z\":0.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":1.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":2.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":3.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":4.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":5.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":6.5,\"value\":0.0,\"x\":1.3373924645,\"y\":48.0685683825},{\"z\":2.5,\"value\":0.01,\"x\":1.3373907685,\"y\":48.0686223628},{\"z\":3.5,\"value\":0.01,\"x\":1.3373907685,\"y\":48.0686223628},{\"z\":4.5,\"value\":0.0,\"x\":1.3373907685,\"y\":48.0686223628},{\"z\":5.5,\"value\":0.0,\"x\":1.3373907685,\"y\":48.0686223628},{\"z\":6.5,\"value\":0.0,\"x\":1.3373907685,\"y\":48.0686223628},{\"z\":0.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":1.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":2.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":3.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":4.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":5.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":6.5,\"value\":0.0,\"x\":1.3373902031,\"y\":48.0686403562},{\"z\":0.5,\"value\":0.0,\"x\":1.3373896378,\"y\":48.0686583497},{\"z\":1.5,\"value\":0.0,\"x\":1.3373896378,\"y\":48.0686583497},{\"z\":2.5,\"value\":0.0,\"x\":1.3373896378,\"y\":48.0686583497},{\"z\":3.5,\"value\":0.0,\"x\":1.3373896378,\"y\":48.0686583497},{\"z\":0.5,\"value\":0.01,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":1.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":2.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":3.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":4.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":5.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":6.5,\"value\":0.0,\"x\":1.3374210063,\"y\":48.0685147811},{\"z\":0.5,\"value\":0.0,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":1.5,\"value\":0.007917,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":2.5,\"value\":0.01,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":3.5,\"value\":0.0,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":4.5,\"value\":0.0,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":5.5,\"value\":0.0,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":6.5,\"value\":0.0,\"x\":1.3374204409,\"y\":48.0685327746},{\"z\":0.5,\"value\":0.0,\"x\":1.3374198756,\"y\":48.068550768},{\"z\":1.5,\"value\":0.01,\"x\":1.3374198756,\"y\":48.068550768},{\"z\":4.5,\"value\":0.0,\"x\":1.3374187449,\"y\":48.0685867549},{\"z\":5.5,\"value\":0.0,\"x\":1.3374187449,\"y\":48.0685867549},{\"z\":6.5,\"value\":0.0,\"x\":1.3374187449,\"y\":48.0685867549},{\"z\":0.5,\"value\":0.004494,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":1.5,\"value\":0.021461,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":2.5,\"value\":0.049333,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":3.5,\"value\":0.104282,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":4.5,\"value\":0.005107,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":5.5,\"value\":0.0,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":6.5,\"value\":0.0,\"x\":1.3374181796,\"y\":48.0686047483},{\"z\":0.5,\"value\":0.01,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":1.5,\"value\":0.093304,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":2.5,\"value\":0.186088,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":3.5,\"value\":0.08879,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":4.5,\"value\":0.001898,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":5.5,\"value\":0.0,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":6.5,\"value\":0.0,\"x\":1.3374176143,\"y\":48.0686227417},{\"z\":0.5,\"value\":0.01,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":1.5,\"value\":0.01,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":2.5,\"value\":0.037914,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":3.5,\"value\":0.01,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":4.5,\"value\":0.0,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":5.5,\"value\":0.0,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":6.5,\"value\":0.0,\"x\":1.3374170489,\"y\":48.0686407352},{\"z\":1.5,\"value\":0.0,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":2.5,\"value\":0.009923,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":3.5,\"value\":0.0,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":4.5,\"value\":0.0,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":5.5,\"value\":0.0,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":6.5,\"value\":0.0,\"x\":1.3374159183,\"y\":48.068676722},{\"z\":0.5,\"value\":0.007838,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":1.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":2.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":3.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":4.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":5.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":6.5,\"value\":0.0,\"x\":1.3374153529,\"y\":48.0686947155},{\"z\":0.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":1.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":2.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":3.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":4.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":5.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":6.5,\"value\":0.0,\"x\":1.3374147876,\"y\":48.0687127089},{\"z\":0.5,\"value\":0.0,\"x\":1.337447852,\"y\":48.06851516},{\"z\":1.5,\"value\":0.0,\"x\":1.337447852,\"y\":48.06851516},{\"z\":2.5,\"value\":0.0,\"x\":1.337447852,\"y\":48.06851516},{\"z\":3.5,\"value\":0.0,\"x\":1.337447852,\"y\":48.06851516},{\"z\":6.5,\"value\":0.0,\"x\":1.3374467214,\"y\":48.0685511469},{\"z\":0.5,\"value\":0.239314,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":1.5,\"value\":2.742578,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":2.5,\"value\":0.01,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":3.5,\"value\":0.0,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":4.5,\"value\":0.0,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":5.5,\"value\":0.0,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":6.5,\"value\":0.0,\"x\":1.337446156,\"y\":48.0685691403},{\"z\":0.5,\"value\":0.313385,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":1.5,\"value\":5.140071,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":2.5,\"value\":0.01,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":3.5,\"value\":0.01,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":4.5,\"value\":0.0,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":5.5,\"value\":0.0,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":6.5,\"value\":0.0,\"x\":1.3374455907,\"y\":48.0685871338},{\"z\":0.5,\"value\":0.21646,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":1.5,\"value\":118.764366,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":2.5,\"value\":0.53214,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":3.5,\"value\":0.406898,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":4.5,\"value\":0.01,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":5.5,\"value\":0.0,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":6.5,\"value\":0.0,\"x\":1.3374450254,\"y\":48.0686051272},{\"z\":0.5,\"value\":2.153168,\"x\":1.3374444601,\"y\":48.0686231206},{\"z\":1.5,\"value\":209.819275,\"x\":1.3374444601,\"y\":48.0686231206},{\"z\":3.5,\"value\":1.701351,\"x\":1.3374438948,\"y\":48.0686411141},{\"z\":4.5,\"value\":0.003377,\"x\":1.3374438948,\"y\":48.0686411141},{\"z\":5.5,\"value\":0.0,\"x\":1.3374438948,\"y\":48.0686411141},{\"z\":6.5,\"value\":0.0,\"x\":1.3374438948,\"y\":48.0686411141},{\"z\":0.5,\"value\":214.435974,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":1.5,\"value\":0.59179,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":2.5,\"value\":131.55426,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":3.5,\"value\":0.205028,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":4.5,\"value\":0.0,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":5.5,\"value\":0.0,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":6.5,\"value\":0.0,\"x\":1.3374433294,\"y\":48.0686591075},{\"z\":0.5,\"value\":148.420685,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":1.5,\"value\":0.202316,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":2.5,\"value\":1.836217,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":3.5,\"value\":0.153939,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":4.5,\"value\":0.0,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":5.5,\"value\":0.0,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":6.5,\"value\":0.0,\"x\":1.3374427641,\"y\":48.0686771009},{\"z\":0.5,\"value\":0.48572,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":1.5,\"value\":0.186019,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":2.5,\"value\":0.144139,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":3.5,\"value\":0.039071,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":4.5,\"value\":0.0,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":5.5,\"value\":0.0,\"x\":1.3374421988,\"y\":48.0686950944},{\"z\":1.5,\"value\":0.004134,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":2.5,\"value\":0.0,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":3.5,\"value\":0.0,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":4.5,\"value\":0.0,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":5.5,\"value\":0.0,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":6.5,\"value\":0.0,\"x\":1.3374741324,\"y\":48.0685335324},{\"z\":0.5,\"value\":0.01321,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":1.5,\"value\":1.487166,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":2.5,\"value\":0.01,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":3.5,\"value\":0.0,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":4.5,\"value\":0.0,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":5.5,\"value\":0.0,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":6.5,\"value\":0.0,\"x\":1.3374735671,\"y\":48.0685515258},{\"z\":0.5,\"value\":201.34964,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":1.5,\"value\":340.51889,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":2.5,\"value\":0.01,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":3.5,\"value\":0.0,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":4.5,\"value\":0.0,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":5.5,\"value\":0.0,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":6.5,\"value\":0.0,\"x\":1.3374730018,\"y\":48.0685695192},{\"z\":0.5,\"value\":214.412827,\"x\":1.3374724365,\"y\":48.0685875127},{\"z\":1.5,\"value\":277.878662,\"x\":1.3374724365,\"y\":48.0685875127},{\"z\":2.5,\"value\":0.01,\"x\":1.3374724365,\"y\":48.0685875127},{\"z\":3.5,\"value\":0.01,\"x\":1.3374724365,\"y\":48.0685875127},{\"z\":5.5,\"value\":0.0,\"x\":1.3374718712,\"y\":48.0686055061},{\"z\":6.5,\"value\":0.0,\"x\":1.3374718712,\"y\":48.0686055061},{\"z\":0.5,\"value\":907.436951,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":1.5,\"value\":637.995422,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":2.5,\"value\":221.520111,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":3.5,\"value\":233.294907,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":4.5,\"value\":0.01265,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":5.5,\"value\":0.0,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":6.5,\"value\":0.0,\"x\":1.3374713059,\"y\":48.0686234995},{\"z\":0.5,\"value\":1707.0,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":1.5,\"value\":452.631165,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":2.5,\"value\":460.121521,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":3.5,\"value\":239.645096,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":4.5,\"value\":0.01,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":5.5,\"value\":0.0,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":6.5,\"value\":0.0,\"x\":1.3374707406,\"y\":48.068641493},{\"z\":0.5,\"value\":1707.0,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":1.5,\"value\":179.37738,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":2.5,\"value\":551.6604,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":3.5,\"value\":147.201599,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":4.5,\"value\":0.0,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":5.5,\"value\":0.0,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":6.5,\"value\":0.0,\"x\":1.3374701753,\"y\":48.0686594864},{\"z\":0.5,\"value\":944.119629,\"x\":1.3374696099,\"y\":48.0686774798},{\"z\":3.5,\"value\":0.038766,\"x\":1.3374684793,\"y\":48.0687134667},{\"z\":4.5,\"value\":0.008704,\"x\":1.3374684793,\"y\":48.0687134667},{\"z\":5.5,\"value\":0.0,\"x\":1.3374684793,\"y\":48.0687134667},{\"z\":6.5,\"value\":0.0,\"x\":1.3374684793,\"y\":48.0687134667},{\"z\":0.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":1.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":2.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":3.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":4.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":5.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":6.5,\"value\":0.0,\"x\":1.3375015435,\"y\":48.0685159178},{\"z\":0.5,\"value\":0.0,\"x\":1.3375009782,\"y\":48.0685339113},{\"z\":1.5,\"value\":0.0,\"x\":1.3375009782,\"y\":48.0685339113},{\"z\":2.5,\"value\":0.0,\"x\":1.3375009782,\"y\":48.0685339113},{\"z\":3.5,\"value\":0.0,\"x\":1.3375009782,\"y\":48.0685339113},{\"z\":4.5,\"value\":0.0,\"x\":1.3375009782,\"y\":48.0685339113},{\"z\":1.5,\"value\":71.001534,\"x\":1.337498717,\"y\":48.068605885},{\"z\":2.5,\"value\":0.095065,\"x\":1.337498717,\"y\":48.068605885},{\"z\":3.5,\"value\":0.390979,\"x\":1.337498717,\"y\":48.068605885},{\"z\":4.5,\"value\":0.01,\"x\":1.337498717,\"y\":48.068605885},{\"z\":5.5,\"value\":0.0,\"x\":1.337498717,\"y\":48.068605885},{\"z\":6.5,\"value\":0.0,\"x\":1.337498717,\"y\":48.068605885},{\"z\":0.5,\"value\":964.322998,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":1.5,\"value\":216.863602,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":2.5,\"value\":117.731232,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":3.5,\"value\":357.550354,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":4.5,\"value\":0.055908,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":5.5,\"value\":0.0,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":6.5,\"value\":0.0,\"x\":1.3374981517,\"y\":48.0686238784},{\"z\":0.5,\"value\":1256.054443,\"x\":1.3374975864,\"y\":48.0686418719},{\"z\":1.5,\"value\":193.766129,\"x\":1.3374975864,\"y\":48.0686418719},{\"z\":2.5,\"value\":208.852859,\"x\":1.3374975864,\"y\":48.0686418719},{\"z\":5.5,\"value\":0.0,\"x\":1.3374964558,\"y\":48.0686778587},{\"z\":6.5,\"value\":0.0,\"x\":1.3374964558,\"y\":48.0686778587},{\"z\":0.5,\"value\":0.351365,\"x\":1.3374958905,\"y\":48.0686958522},{\"z\":1.5,\"value\":0.175703,\"x\":1.3374958905,\"y\":48.0686958522},{\"z\":2.5,\"value\":0.112065,\"x\":1.3374958905,\"y\":48.0686958522},{\"z\":3.5,\"value\":0.022484,\"x\":1.3374958905,\"y\":48.0686958522},{\"z\":4.5,\"value\":0.0,\"x\":1.3374958905,\"y\":48.0686958522},{\"z\":5.5,\"value\":0.0,\"x\":1.3374958905,\"y\":48.0686958522}]"
    // transform strin_arr into an array
    const brr : Array<string> = JSON.parse(strin_arr);
    const arrayyyy : Array<string> = JSON.parse(string_array);
    file_to_download.value = arrayyyy;

    filename.value = "modelisation"
    console.log(167)

  }
  else {
    console.log("jhsdssfskj")
  }
}


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
    } else if (array_of_champs.value[i][0].type_of_params == "file") {
      const csv_file = array_of_champs.value[i][1].value;
      
      let reader = new FileReader();

      reader.readAsText(csv_file);
      reader.onload = () => {
        const csv_string: string = reader.result as string;
        const new_data_csv = PaPa.parse(csv_string, { delimiter: ";", header: true, skipEmptyLines: true }).data;
        body_json[array_of_champs.value[i][0].name] = new_data_csv
      }
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
      file_to_download.value = ['']
      status_post.value = "pending";
    },
    onResponse({ request, response, options }) {
      console.log("response._data", response._data);
      
      res_from_post.value = deal_with_response(response._data);    // TODO: this should also work when the endpoint does not return a fig
      
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

// clean up of params and results if new file is selected
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