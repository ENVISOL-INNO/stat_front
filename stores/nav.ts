import { defineStore } from 'pinia'

export const useMyNavStore = defineStore({
  id: 'my_nav',
  // state: () => {return {data_csv: [""], colonnes: [""], results: [               // le return est important !
  //   new Resultat("EDASwarmPlot", {"swarmplot_nom_elem": "", "swarmplot_nom_classifier": ""}, "", ""),
  //   new Resultat("EDABoxPlot", {"boxplot_sum_element": "", "boxplot_list_elements": [""]}, "", "")
  // ]}},

  state: () => {
    return {               // le return est important !
      mode_spectro: false,
      show_stat_formulaire: true,
      show_swarmplot: false,
      show_boxplot: false,
      show_freq_cum: false,
      show_hist: false,
      show_modelling: false,
      show_bm: false,
      show_calc_vol: false,
    }
  },
  actions: {
  }
})
