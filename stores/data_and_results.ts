import { defineStore } from 'pinia'

// export type AllowedParameters =
//   | 'swarmplot_nom_elem'
//   | 'swarmplot_nom_classifier'
//   | 'boxplot_sum_element'
//   | 'boxplot_selected_list_elements'
//   | 'freq_cum_nom_id_sample'
//   | 'freq_cum_nom_elem'

// export type ParameterMap = {
//   [key in AllowedParameters]?: Parameter
// }

// based on this: https://medium.com/@perisicnikola37/dont-use-typescript-types-like-this-use-map-pattern-instead-bed75a0e986e
// Here to add a type of parameter
export type Parameter = {
  type_of_params: "col" | "col_list" | "num" | "num_list" | "string" | "file" | "txt_list" ; // here: add text input
  value: Array<string> | string | number | Array<number> | Array<File> ;
}

export type ParameterMap = Record<string, Parameter>

export class Resultat {
  endpoint_called: string;
  parameters: ParameterMap;
  result: string;
  name_fig?: string;

  constructor(endpoint_called: string, parameters: ParameterMap, result: string, name_fig: string) {
    this.endpoint_called = endpoint_called;
    this.parameters = parameters;
    this.result = result;
    this.name_fig = name_fig;
  };

  make_name_for_export() {
    return this.endpoint_called + this.name_fig
  };
}


export const useMyData_and_resultsStore = defineStore({
  id: 'myData_and_resultsStore',
  state: () => {
    return {               // le return est important !
      data_csv: [] as unknown[],
      colonnes: [] as string[],
      results: [] as Resultat[]
    }
  },

  actions: {
    set_data_csv(new_data_csv: unknown[]) {
      this.data_csv = new_data_csv;
      // if the file changes then no need to save the previous analysis in this store. if we want to keep them, maybe add an "archive" store?
      this.results = [] as Resultat[];
    },

    set_colonnes(new_colonnes: string[]) {
      this.colonnes = new_colonnes
    },

    add_result(result: Resultat) {
      this.results.push(result)
    },

    get_relevant_resultat(endpoint_: string, parameters : ParameterMap) : Resultat {
      const relevant_res = this.results.filter((value) => value.endpoint_called == endpoint_);
      console.log("relevant_res", relevant_res);
      if (relevant_res.length == 0) {
        console.log("u here")
        return new Resultat(
          endpoint_,
          // parameters,
          parameters,
          "",
          ""
        )
      }
      else {
        return relevant_res[relevant_res.length - 1]
      };
    }
  }
})

// Not very elegant...
export const useMySpectraStore = defineStore({
  id: 'mySpectraStore',
  state: () => {
    return {               // le return est important !
      data_csv: [] as unknown[],
      colonnes: [] as string[],
      results: [] as Resultat[]
    }
  },

  actions: {
    set_data_csv(new_data_csv: unknown[]) {
      this.data_csv = new_data_csv;
      // if the file changes then no need to save the previous analysis in this store. if we want to keep them, maybe add an "archive" store?
      this.results = [] as Resultat[];
    },

    set_colonnes(new_colonnes: string[]) {
      this.colonnes = new_colonnes
    },

    add_result(result: Resultat) {
      this.results.push(result)
    },

    get_relevant_resultat(endpoint_: string, parameters : ParameterMap) : Resultat {
      const relevant_res = this.results.filter((value) => value.endpoint_called == endpoint_);
      console.log("relevant_res", relevant_res);
      if (relevant_res.length == 0) {
        console.log("u here")
        return new Resultat(
          endpoint_,
          // parameters,
          parameters,
          "",
          ""
        )
      }
      else {
        return relevant_res[relevant_res.length - 1]
      };
    }
  }
})
