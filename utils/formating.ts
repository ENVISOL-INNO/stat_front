import * as PaPa from 'papaparse';
import type { Champ } from "~/components/formulaire/standard.vue";


export async function format_param(champ: Champ, ref_value: any) {
  console.log("ggg");
  console.log(champ);
  if (champ.processing !== undefined) {
    return champ.processing(ref_value);
  }
  if(champ.type_of_params == "num") {
    return Number(ref_value)
  } else if (champ.type_of_params == "num_list") {
    var full_string: String = String(ref_value); // This is a bit unnecessary, it simply unsures that full string is indeed a string
    var list_str = full_string.split(' ');
    return list_str.map(s => Number(s))
  } else if (champ.type_of_params == "txt_list") {
    const vv : string = String(ref_value)
    var v: String = champ.options[vv];
    return v
  } else if (champ.type_of_params == "file") {
    console.log("ref_value.name", ref_value.name);
    console.log("ref_value.name === undefined", ref_value.name === undefined);
    if (ref_value.name === undefined) {
      console.log("vctoir")
      return []
    }
    else if (ref_value.name.endsWith(".csv")) {
      console.log("cold = bad")
      const csv_file = ref_value;
      let reader = new FileReader();
      reader.readAsText(csv_file);
      reader.onload = () => {
        const csv_string: string = reader.result as string;
        const new_data_csv = PaPa.parse(csv_string, { delimiter: ";", header: true, skipEmptyLines: true }).data;
        return new_data_csv;
      }
    } else if (ref_value.name.endsWith(".geojson")) {
      console.log("alcoholism = bad")
      const contents = await ref_value.text();
      console.log(49, contents);
      console.log(49, typeof(contents));
      const new_data_json = JSON.parse(contents);
      console.log("38");
      console.log(new_data_json["features"][0]["geometry"]["coordinates"][0]);
      const array_points = new_data_json["features"][0]["geometry"]["coordinates"][0][0];
      const table: object[] = array_points.map((elt: [number, number]) => { 
        return { "x": elt[0], "y": elt[1] }
      });
      console.log(43);
      console.log(table);
      return table
    }
  } else {
      console.log("portugal = bad")
      return ref_value;
  }
}

export function format_csv(parsed_csv_array: Array<object>) {
  var x: boolean = false;
  var y: boolean = false;
  var z: boolean = false;
  var d: boolean = false;
  if ("X" in parsed_csv_array[0]) {
    x = true;
  } if ("Y" in parsed_csv_array[0]) {
    x = true;
  } if ("Z" in parsed_csv_array[0]) {
    x = true;
  } if ("Drillhole" in parsed_csv_array[0]) {
    x = true;
  }
}
