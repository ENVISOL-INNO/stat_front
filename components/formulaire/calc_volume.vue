<template>
  <h1>Calcul de volumes</h1>
  <v-text-field v-model="grid_steps" label="Taille de la cellule élémentaire en x en y en z séparées par un espace"></v-text-field>  
  <v-select v-model="pollutants_names" :items="store.colonnes" label="Composé(s)" multiple clearable></v-select>
  <div v-if="pollutants_names.length > 0">
    <v-expansion-panels v-model="panel">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <h3>Définition des seuils</h3>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          Pour tester plusieurs seuils, saisir les différents seuils séparés par un espace (ex. 0 200 1000).<br>
          Pour découper le résultat par une emprise, sélectionner une colonne de type "Site" dans le dernier champs. <br>
          Par défaut, les volumes par tranche de profondeur et le volume de couverture sont calculés.<br>
          Si plusieurs composés sont sélectionnés, un volume de dépassement "Tout composés" sera calculé ;
          il correspond au volume pour lequel au moins 1 composé dépasse le <i>dernier seuil saisi pour ce composé</i><br><br>
          <v-card v-if="pollutants_names.length > 1">
            Ici, "Tout composé" correspond au volume qui correspond à au moins un des critères suivants :
            <p v-for="i in pollutants_names.length">
              - {{ pollutants_names[i-1] }} {{ array_of_champs_rule[i-1][1] }} {{array_of_champs_comp[i-1][1].value.split(' ')[array_of_champs_comp[i-1][1].value.split(' ').length-1]}}
            </p>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div class="comp_rule" v-for="i in pollutants_names.length">
      <v-text-field :model-value="pollutants_names[i-1]" readonly></v-text-field>
      <!-- {{ pollutants_names[i-1] }} -->
      <v-select style="size: 0.1rem" v-model="array_of_champs_rule[i-1][1].value" :items="['≥', '=', '≤']" label="règle"></v-select>
      <!-- <v-select v-model="array_of_champs_rule[i-1][1].value" :items="['>', '≥', '=', '<', '≤']" label="règle"></v-select> -->
      <v-text-field v-model="array_of_champs_comp[i-1][1].value" :label="array_of_champs_comp[i-1][0].label"></v-text-field>
    </div>

  </div>
  <v-select v-model="mode_z" :items="['Profondeur relative', 'Altitude en mNGF']" label="Z est exprimé en :"></v-select>
  
  <div>Paramètre optionel, à laisser vide si besoin</div>
  <div>
    <v-select v-model="site" :items="store.colonnes" label="Site ou zone" clearable></v-select>
    <v-text-field v-if="site" v-model="site_val" label="Valeur à égaler"></v-text-field>
  </div>
  <div>
    <!-- <v-select v-model="loop" :items="['Oui', 'Non']" label="Calcu sur la colonne"></v-select> -->

    <!-- <v-select v-model="array_of_champs[i-1][1].value" :items="store.colonnes" label="Colonne avec la profondeur/l'altitude"></v-select> -->
  </div>
  <div class="button">
    <v-btn color="primary" @click="post_form">Go</v-btn>
    <v-progress-circular v-if="status_post == 'pending'"
    color="green"
    indeterminate
    ></v-progress-circular>
  </div>
  <!-- {{status_post}} -->
  <div v-if="res_from_post != '' && status_post != 'pending' && bool_file_to_download">
    <DownloadBlobBtn :data="file_to_download" :filename="filename" />
    <!-- <NuxtImg sizes="sm:600px md:760px lg:1200px xl:1200px" v-bind:src="`data:image/jpg;base64,${res_from_post}`" /> -->
  </div>
  <div v-if="status_post == 'error'">
    Erreur !
  </div>
  <div v-if="json_table != undefined && status_post && status_post != 'pending'">
    <v-data-table :headers="headers" :items="json_table"></v-data-table>
  </div>
</template>

<script lang="ts" setup>
  import { useMyData_and_resultsStore, Resultat } from '~/stores/data_and_results';
  import { format_param } from '#imports';
  import { type Champ } from './standard.vue';

  const panel = ref([0])
  const translation = {
      // '>': "above_value", '≥': "above_value", '=': "equal_to_value", '<': "below_value", '≤': "below_value",
      "Profondeur relative": "relativ", "Altitude en mNGF": "ngf"
    }

  const runtimeConfig = useRuntimeConfig()
  const bck_end_base_url_ = runtimeConfig.public.backend_swag_url_public;

  const status_post = ref("");

  const store = useMyData_and_resultsStore();
  console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", store)
  const endpoint_name = "/access_volume_analysis_table"

  let bool_file_to_download : Ref<boolean> = ref(false)
  let file_to_download : Ref<Array<string>> = ref([""])
  let filename : Ref<string> = ref("")

  const list_champ_calc_vol: Array<Champ> = [
    { label: "Taille de la cellule élémentaire en x en y en z séparées par un espace", name: "grid_steps", type_of_params: "num_list", value: "5 5 1" },
    { label: "Paramètres", name: "pollutants_names", type_of_params: "col_list", value: [] },
    { label: "Site ou zone", name: "site", type_of_params: "col", value: "" },
    { label: "valeur à égaler", name: "site_val", type_of_params: "num", value: 1 },
    { label: "Z est exprimé en :", name: "mode_z", type_of_params: "txt_list", value: "Profondeur relative", options: ['Profondeur relative', 'Altitude en mNGF'] },
  ];


  const parameters : ParameterMap = {} ;
  for (let i =0; i < list_champ_calc_vol.length; i++) {
    let champ : Champ = list_champ_calc_vol[i];
    let name : keyof ParameterMap  = champ.name as string;
    parameters[name] = {"type_of_params": champ.type_of_params, "value": champ.value}
  }

  const init_form = store.get_relevant_resultat(endpoint_name, parameters);
  console.log("init_form", init_form)
  const init_form_params = init_form.parameters;
  const res_from_post : Ref<string | string[]> = ref(init_form.result);
  const grid_steps = ref(init_form_params["grid_steps"].value);


  const pollutants_names = ref(init_form_params["pollutants_names"].value as string[])
  // const nb_comp = ref(init_form_params["nb_comp"].value as number);
  const array_of_champs_comp : Ref<Array<[Champ, Ref<string | string[] | number | number[] | File[]>]>> = ref([]);
  const array_of_champs_rule : Ref<Array<[Champ, Ref<string | string[] | number | number[] | File[]>]>> = ref([]);
  let memory : string[]
  function update_rules_and_threshs() {
    console.log("rrrrrrr", array_of_champs_comp.value);
    memory = array_of_champs_comp.value.map((item: Array<[Champ, Ref]>) => item[0].name) ;

    let temp_comp : Array<[Champ, Ref<string | string[] | number | number[] | File[]>]> = []
    let temp_rule : Array<[Champ, Ref<string | string[] | number | number[] | File[]>]> = []

    for (let i = 0; i < pollutants_names.value.length; i++) {
      if (!(memory.includes(`thresholds_${pollutants_names.value[i]}`))) {
        let champ_comp : Champ = { label: `Seuils pour ${pollutants_names.value[i]}`, name: `thresholds_${pollutants_names.value[i]}`, type_of_params: "num_list", value: "" };
        let champ_rule : Champ = { label: `Seuils pour ${pollutants_names.value[i]}`, name: `rule_${pollutants_names.value[i]}`, type_of_params: "string", value: "" };
        
        console.log(444444444, pollutants_names.value[i])
        // let name : keyof ParameterMap  = champ.name as string;
        console.log(init_form_params[`thresholds_${pollutants_names.value[i]}`]? init_form_params[`thresholds_${pollutants_names.value[i]}`].value : "");
        temp_comp.push([champ_comp, ref(init_form_params[`thresholds_${pollutants_names.value[i]}`]? init_form_params[`thresholds_${pollutants_names.value[i]}`].value : "")]);
        temp_rule.push([champ_rule, ref(init_form_params[`rule_${pollutants_names.value[i]}`]? init_form_params[`rule_${pollutants_names.value[i]}`].value : "≥")]);
        console.log(array_of_champs_comp.value);
      } else {
        console.log(5555555555555, pollutants_names.value[i])
        temp_comp.push(array_of_champs_comp.value[i])
        temp_rule.push(array_of_champs_rule.value[i])
      }
      console.log(6666666666, array_of_champs_rule.value.map((item: Array<[Champ, Ref]>) => item[0].name))
    };
    array_of_champs_comp.value = temp_comp
    array_of_champs_rule.value = temp_rule
  }
  update_rules_and_threshs()
  watch(() => pollutants_names.value, update_rules_and_threshs)

  const site = ref(init_form_params["site"].value)
  const site_val = ref(init_form_params["site_val"].value)
  const mode_z = ref(init_form_params["mode_z"].value)

  // const loop = ref(init_form_params["loop"].value)

  let array_of_champs : Ref<Array<[Champ, Ref<string | string[] | number | number[] | File[]>]>> = ref([
    [{ label: "Taille de la cellule élémentaire en x en y en z séparées par un espace", name: "grid_steps", type_of_params: "num_list", value: "5 5 1" }, grid_steps],
    [{ label: "Paramètres", name: "pollutants_names", type_of_params: "col_list", value: [] }, pollutants_names],
    // [{ label: "règle", name: "rule", type_of_params: "txt_list", value: [">", "≥", "=", "<", "≤"] }, rule],
    // [{ label: "Seuils séparés par un espace (ex. 0 200 1000)", name: "thresholds", type_of_params: "num_list", value: "" },thresholds],
    [{ label: "Site ou zone", name: "site", type_of_params: "col", value: "" }, site],
    [{ label: "valeur à égaler (nombre)", name: "site_val", type_of_params: "num", value: "" }, site_val],
    [{ label: "Z est exprimé en :", name: "mode_z", type_of_params: "txt_list", value: "Profondeur relative", options: ['Profondeur relative', 'Altitude en mNGF'] }, mode_z]
  ])

  let headers : Ref<{title: string, value: string}[]> = ref([]);
  let json_table = ref([]);

  function deal_with_response(res: any) {
    // console.log("res");
    // console.log(res);
    console.log(res["df"]);
    // console.log(typeof(res));
    if (res['df'] !== undefined) {
      bool_file_to_download.value = true;
      const arrayyyy : Array<string> = res['df'];
      filename.value = "calcul_de_volume";
      file_to_download.value = arrayyyy
      return arrayyyy;
    }
    else {
      console.log("jhsdssfskj")
      return ''
    }
  }


  async function post_form() {

    var body_json: {[id : string]: object | string | number | number[] } = {}
    var body_params_only : ParameterMap = {}
    var pre_json: {[id : string]: string | string[] | number | number[]} = {}
    headers.value = [{title: "Profondeurs en m :", value: "Profondeurs en m :"}]
    const array_of_refarray = [array_of_champs, array_of_champs_comp, array_of_champs_rule]
    
    for (let i = 0 ; i < array_of_refarray.length; i++) {
      for (let j = 0 ; j < array_of_refarray[i].value.length; j++) {
        const c = await format_param(array_of_refarray[i].value[j][0], array_of_refarray[i].value[j][1].value) ;
        pre_json[array_of_refarray[i].value[j][0].name] = c
        body_params_only[array_of_refarray[i].value[j][0].name] = {type_of_params: array_of_refarray[i].value[j][0].type_of_params, value: array_of_refarray[i].value[j][1].value}
      }
    }

    let strat: {[id : string]: any } = {
      "common" : {},
      "specific": {},
      "loop": "z",
    };

    if (pre_json["site"] != "" && pre_json["site"] !== null) {
      const site_col = pre_json["site"];
      strat["common"] = {};
      // strat["common"][site_col] = {"value_min": pre_json["site_val"], "value_max": pre_json["site_val"]}
    }
    console.log("214 pre_json", pre_json)
    
    const comp_list : string[] = pre_json["pollutants_names"] as string[];
    const tout_comp = comp_list.length > 1
    strat["specific"] = {};
    if(tout_comp) {
      strat["specific"]["Tout composés (seuils les plus élevés)"] = {}
    }
    console.log("221 tout_comp", tout_comp, typeof(tout_comp));
    console.log("221 comp_list", comp_list, typeof(comp_list));
    comp_list.forEach(comp => {
      const thresh_list = pre_json[`thresholds_${comp}`] as number[];
      if (pre_json[`rule_${comp}`] = "≥") {
        thresh_list.forEach(thresh => {
          strat["specific"][comp+ "_" + thresh] = {};
          strat["specific"][comp+ "_" + thresh][comp] = {"value_min": thresh, "value_max": 99999999999}
          if(tout_comp) {strat["specific"]["Tout composés (seuils les plus élevés)"][comp] = {"value_min": thresh, "value_max": 99999999999}}
        });
      } else if (pre_json[`rule_${comp}`] = "=") {
        thresh_list.forEach(thresh => {
          strat["specific"][comp+ "_" + thresh] = {};
          strat["specific"][comp+ "_" + thresh][comp] = {"value_min": thresh, "value_max": thresh}
          if(tout_comp) { strat["specific"]["Tout composés (seuils les plus élevés)"][comp] = {"value_min": thresh, "value_max": thresh} }
        });
      } else {
        thresh_list.forEach(thresh => {
          strat["specific"][comp+ "_" + thresh] = {};
          strat["specific"][comp+ "_" + thresh][comp] = {"value_min": -999999, "value_max": thresh}
          if(tout_comp) {strat["specific"]["Tout composés (seuils les plus élevés)"][comp] = {"value_min": thresh, "value_max": 99999999999}}
        });
      }
    })

    body_json = {
      "dataframe": store.data_csv,
      "strat": strat,
      "grid_steps": pre_json["grid_steps"],
      "mode_z": translation[pre_json["mode_z"]]
    }

    Object.keys(strat["specific"]).forEach((col : string) => headers.value.push({title: col, value: col}))
    console.log("headers.value", headers.value)
    const { data: res, status } = await useFetch(bck_end_base_url_ + endpoint_name, {
      method: 'POST',
      body: body_json,
      onRequest({}){
        file_to_download.value = ['']
        status_post.value = "pending";
      },
      onResponse({ request, response, options }) {
        // console.log("response._data", response._data);
        json_table.value = response._data["df"]
        res_from_post.value = deal_with_response(response._data);
        console.log("body_params_only", body_params_only)
        const res = new Resultat(
          endpoint_name,
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
  for (let i = 0; i < list_champ_calc_vol.length; i++) {
    array_of_champs.value[i][1].value = list_champ_calc_vol[i].value
  };
  array_of_champs_comp.value = [];
  array_of_champs_rule.value = [];
  res_from_post.value = ""
  headers.value = []
  json_table.value = []
  bool_file_to_download.value = false
}

</script>

<style>
.comp_rule {
  display: flex;
  justify-content : flex-start  ;
}

.button {
  display: flex;
  justify-content : flex-start  ;
}
</style>