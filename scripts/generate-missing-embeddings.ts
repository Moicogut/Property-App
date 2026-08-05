import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { supabaseServer } from '../src/lib/supabase-server';
import { EmbeddingFactory } from '../src/lib/embeddings/factory';

async function generateMissingEmbeddings() {
  console.log("Iniciando vectorización (embeddings) faltantes...");

  const { data: props, error } = await supabaseServer
    .from('properties')
    .select('id, title, raw_description, city, zone')
    .is('embedding', null);

  if (error) {
    console.error("Error consultando BD:", error.message);
    return;
  }

  if (!props || props.length === 0) {
    console.log("✅ No hay propiedades sin embeddings.");
    return;
  }

  console.log(`Faltan ${props.length} propiedades por vectorizar.`);
  
  const provider = await EmbeddingFactory.getProvider();
  
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    console.log(`Vectorizando [${i+1}/${props.length}] ID: ${p.id}...`);
    // Armar un buen contexto para el embedding
    const textToEmbed = `${p.title || ''} ${p.raw_description || ''} ${p.city || ''} ${p.zone || ''}`.trim();
    
    if (!textToEmbed) {
       console.log(`⚠️ Propiedad vacía, ignorando.`);
       continue;
    }

    try {
      const embedding = await provider.generateEmbedding(textToEmbed);
      
      // pgvector requires array notation or JSON stringified array. 
      // Supabase JS SDK handles arrays natively.
      const { error: updateError } = await supabaseServer
        .from('properties')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', p.id);
      
      if (updateError) {
         console.error(`❌ Error actualizando BD (ID: ${p.id}):`, updateError.message);
      } else {
         console.log(`✅ ID: ${p.id} actualizado.`);
      }
    } catch(e: any) {
      console.error(`❌ Error generando embedding para ID: ${p.id}:`, e.message);
    }
    
    // Pequeño delay para no llegar al rate limit de la IA
    await new Promise(r => setTimeout(r, 600));
  }
  
  console.log("🎉 Proceso finalizado.");
}

generateMissingEmbeddings().catch(console.error);
