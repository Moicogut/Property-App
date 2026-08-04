import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabase } from "../src/lib/supabase";

async function main() {
  const { data, error } = await supabase.from("properties").select("*").limit(3);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

main();
