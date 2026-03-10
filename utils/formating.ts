import * as PaPa from 'papaparse';
import type { Champ } from "~/components/formulaire/standard.vue";


export function format_param(champ: Champ, ref_value: any) {
  console.log("ggg");
  if (champ.processing !== undefined) {
    return champ.processing(ref_value);
  }
  if(champ.type_of_params == "num") {
    return Number(ref_value)
  } else if (champ.type_of_params == "num_list") {
    var full_string: String = String(ref_value); // This is a bit unnecessary, it simply unsures that full string is indeed a string
    var list_str = full_string.split(' ');
    return list_str.map(s => Number(s))
  } else if (champ.type_of_params == "file") {
    const csv_file = ref_value;
    let reader = new FileReader();
    reader.readAsText(csv_file);
    reader.onload = () => {
      const csv_string: string = reader.result as string;
      const new_data_csv = PaPa.parse(csv_string, { delimiter: ";", header: true, skipEmptyLines: true }).data;
      return new_data_csv;
    }
  } else {
    return ref_value;
  }
}
