import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateReport() {
  console.log("Generando reporte de estado...");
  let report = `# 📊 PROPERTY OS - STATUS REPORT\n\n`;
  report += `**Fecha de generación:** ${new Date().toISOString()}\n\n`;

  // 1. ESTADO DE BASE DE DATOS (Supabase)
  report += `## 🗄️ 1. Estado de Base de Datos (Supabase)\n\n`;
  
  const tables = ['properties', 'leads', 'organizations', 'users', 'leads_piloto', 'appointments'];
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          report += `- **${table}**: No existe.\n`;
        } else {
          report += `- **${table}**: Error al consultar (${error.message}).\n`;
        }
      } else {
        report += `- **${table}**: ${count || 0} registros.\n`;
      }
    } catch (e: any) {
      report += `- **${table}**: Falló la consulta.\n`;
    }
  }
  
  // 2. CONTEO DE PROPIEDADES Y EMBEDDINGS
  report += `\n## 🧠 2. Inventario e IA (Embeddings)\n\n`;
  try {
    const { count: totalProperties } = await supabase.from('properties').select('*', { count: 'exact', head: true });
    // Drizzle/Supabase 'embedding IS NOT NULL'
    const { count: propsWithEmbeddings, error: embeddingError } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (embeddingError) {
      report += `- **Total de propiedades:** ${totalProperties || 0}\n`;
      report += `- **Propiedades con vector (embedding):** Error al consultar columna 'embedding'.\n`;
    } else {
      report += `- **Total de propiedades:** ${totalProperties || 0}\n`;
      report += `- **Propiedades con vector (embedding):** ${propsWithEmbeddings || 0} cargadas.\n`;
    }
  } catch(e) {
    report += `- Error al consultar estado de inventario.\n`;
  }

  // 3. INTEGRACIÓN CON EVOLUTION API
  report += `\n## 💬 3. Integración Evolution API & Webhook\n\n`;
  const evoUrl = process.env.EVOLUTION_API_URL || 'No configurada';
  const evoInstance = process.env.EVOLUTION_INSTANCE_NAME || 'No configurada';
  report += `- **Evolution URL:** ${evoUrl}\n`;
  report += `- **Instancia:** ${evoInstance}\n`;
  report += `- **Webhook:** Configurado hacia /api/whatsapp/webhook\n`;

  // 4. COMPONENTES FRONTEND
  report += `\n## ⚛️ 4. Componentes y Estructura Frontend\n\n`;
  const srcPath = path.resolve(__dirname, '../src');
  try {
    const componentsDir = path.join(srcPath, 'components');
    if (fs.existsSync(componentsDir)) {
      report += `Componentes detectados en \`src/components\`:\n`;
      const readDirRecursive = (dir: string, prefix = '') => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            readDirRecursive(filePath, prefix + file + '/');
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            report += `- \`${prefix}${file}\`\n`;
          }
        });
      };
      readDirRecursive(componentsDir);
    } else {
      report += `- Carpeta src/components no encontrada.\n`;
    }
  } catch (e) {
    report += `- No se pudo leer la estructura del frontend.\n`;
  }

  // 5. CAMBIOS RECIENTES
  report += `\n## 🛠️ 5. Últimos Cambios (Git Logs)\n\n`;
  try {
    const gitLog = execSync('git log -n 5 --oneline').toString();
    report += '```text\n' + gitLog.trim() + '\n```\n';
  } catch (e) {
    report += `- No se pudo obtener el historial de Git (o no es un repo Git).\n`;
  }

  // Escribir a archivo
  const reportPath = path.resolve(__dirname, '../STATUS_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log("✅ Reporte generado y guardado en STATUS_REPORT.md");
  console.log("\n--- CONTENIDO DEL REPORTE ---\n");
  console.log(report);
}

generateReport().catch(console.error);
