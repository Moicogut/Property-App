import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { properties } from "../src/db/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en .env.local");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log("Iniciando actualización de propiedades con precios y dimensiones nulos/cero...");

  try {
    const allProps = await db.select().from(properties);
    console.log(`Se encontraron ${allProps.length} propiedades en total.`);

    let updatedCount = 0;

    for (const prop of allProps) {
      if (!prop.priceUsd || Number(prop.priceUsd) <= 0 || !prop.areaSqm || Number(prop.areaSqm) <= 0) {
        
        const acceptsSocialHousing = prop.acceptsSocialHousing;
        
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

        const titleLower = prop.title.toLowerCase();
        if (titleLower.includes("lote") || titleLower.includes("terreno")) {
          beds = 0;
          baths = 0;
          area = Math.floor(Math.random() * (1500 - 300 + 1)) + 300;
          price = area * (Math.floor(Math.random() * (300 - 150 + 1)) + 150); 
        }

        await db
          .update(properties)
          .set({
            priceUsd: String(price),
            areaSqm: String(area),
            bedrooms: beds,
            bathrooms: baths
          })
          .where(eq(properties.id, prop.id));
        
        updatedCount++;
      }
    }

    console.log(`✅ ¡Éxito! ${updatedCount} propiedades actualizadas con valores realistas.`);

  } catch (error) {
    console.error("❌ Error al actualizar propiedades:", error);
  } finally {
    process.exit(0);
  }
}

main();
