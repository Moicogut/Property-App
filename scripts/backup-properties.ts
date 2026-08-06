import fs from 'fs';
import { supabaseServer } from '../src/lib/supabase-server';

async function backupProperties() {
  console.log("Iniciando backup de properties...");
  const { data, error } = await supabaseServer.from("properties").select("*");
  if (error) {
    console.error("Error al obtener properties:", error);
    process.exit(1);
  }
  
  if (data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_properties_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Backup creado con éxito: ${filename} con ${data.length} registros.`);
  }
}

backupProperties();
