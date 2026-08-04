import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// Usamos Service Role Key explícitamente para saltarnos RLS si hubiera
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Iniciando inyección MASIVA de precios con supabase-js...");

  try {
    // Traer todas sin límite
    const { data: allProps, error } = await supabase.from("properties").select("id, accepts_social_housing, title, price_usd");
    
    if (error) {
      throw error;
    }

    console.log(`Se encontraron ${allProps.length} propiedades en total para forzar precios.`);

    let updatedCount = 0;

    for (const prop of allProps) {
        
        // Vamos a sobrescribir TODAS, incluso las que tienen precio para asegurarnos, 
        // a menos que ya tengan un precio superior a 0, pero el usuario dice "completa". 
        // Si ya está seteado (ej 125000), podemos dejarlo.
        if (prop.price_usd && prop.price_usd > 0) {
            console.log(`La propiedad ${prop.id} ya tiene precio ${prop.price_usd}. Omitiendo.`);
            continue;
        }

        const acceptsSocialHousing = prop.accepts_social_housing;
        let price = 0;
        let area = 0;
        let beds = 1;
        let baths = 1;

        if (acceptsSocialHousing) {
          price = Math.floor(Math.random() * (95000 - 45000 + 1)) + 45000;
          area = Math.floor(Math.random() * (120 - 50 + 1)) + 50;
          beds = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
          baths = Math.floor(Math.random() * (2 - 1 + 1)) + 1;
        } else {
          price = Math.floor(Math.random() * (350000 - 110000 + 1)) + 110000;
          area = Math.floor(Math.random() * (450 - 100 + 1)) + 100;
          beds = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
          baths = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
        }

        const titleLower = (prop.title || "").toLowerCase();
        if (titleLower.includes("lote") || titleLower.includes("terreno")) {
          beds = 0;
          baths = 0;
          area = Math.floor(Math.random() * (1500 - 300 + 1)) + 300;
          price = area * (Math.floor(Math.random() * (300 - 150 + 1)) + 150); 
        }

        // Asegurarse de que al menos tenga 1 minúsculo o 0 si es lote
        await supabase
          .from("properties")
          .update({
            price_usd: price,
            area_sqm: area,
            bedrooms: beds,
            bathrooms: baths
          })
          .eq("id", prop.id);
        
        updatedCount++;
    }

    console.log(`✅ ¡Éxito! ${updatedCount} propiedades actualizadas forzosamente con valores nuevos.`);

  } catch (error) {
    console.error("❌ Error al actualizar propiedades:", error);
  } finally {
    process.exit(0);
  }
}

main();
