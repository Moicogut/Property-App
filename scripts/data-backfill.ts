import { supabaseServer } from '../src/lib/supabase-server';

async function main() {
  console.log("Iniciando Data Backfill (Ghost Data)...");

  // 1. Verificar si hay organizaciones, sino crear la default
  let { data: orgs, error: orgErr } = await supabaseServer.from('organizations').select('*').limit(1);
  if (orgErr) {
    console.error("Error al obtener organizaciones:", orgErr);
    process.exit(1);
  }

  let orgId;
  if (!orgs || orgs.length === 0) {
    console.log("No se encontraron organizaciones. Creando Organización Principal...");
    const { data: newOrg, error: newOrgErr } = await supabaseServer.from('organizations').insert([{
      name: 'Property OS Global',
      whatsapp_instance_id: 'PropertyOS-Main'
    }]).select().single();

    if (newOrgErr) {
      console.error("Error creando org:", newOrgErr);
      process.exit(1);
    }
    orgId = newOrg.id;
  } else {
    orgId = orgs[0].id;
    console.log(`Organización encontrada: ${orgId}`);
  }

  // 2. Verificar usuario admin
  let { data: users, error: userErr } = await supabaseServer.from('users').select('*').limit(1);
  if (userErr) {
    console.error("Error obteniendo usuarios:", userErr);
    process.exit(1);
  }

  let adminId;
  if (!users || users.length === 0) {
    console.log("No se encontraron usuarios. Creando Admin Principal...");
    const { data: newUser, error: newUserErr } = await supabaseServer.from('users').insert([{
      organization_id: orgId,
      email: 'admin@propertyos.com',
      full_name: 'Admin Principal',
      role: 'superadmin'
    }]).select().single();

    if (newUserErr) {
      console.error("Error creando usuario:", newUserErr);
      process.exit(1);
    }
    adminId = newUser.id;
  } else {
    adminId = users[0].id;
    console.log(`Usuario admin encontrado: ${adminId}`);
  }

  // 3. Asignar organización a propiedades que la tengan null o huérfana
  console.log("Actualizando propiedades con organization_id huérfanos...");
  const { error: propErr } = await supabaseServer
    .from('properties')
    .update({ organization_id: orgId })
    .is('organization_id', null);
    
  if (propErr) {
    console.error("Error al actualizar properties:", propErr);
  } else {
    // Para asegurarnos de que TODAS apunten a la org principal (por ser un fix de Ghost Data en fase beta)
    const { error: propErrAll } = await supabaseServer
      .from('properties')
      .update({ organization_id: orgId })
      .neq('organization_id', orgId);
    
    if (propErrAll) {
      console.log("Algunas propiedades no se actualizaron:", propErrAll);
    }
    console.log("Propiedades asignadas correctamente.");
  }

  // 4. Asignar organización a leads que no tengan
  console.log("Actualizando leads con organization_id huérfanos...");
  const { error: leadErr } = await supabaseServer
    .from('leads')
    .update({ organization_id: orgId })
    .is('organization_id', null);

  if (leadErr) {
    console.error("Error actualizando leads:", leadErr);
  } else {
    const { error: leadErrAll } = await supabaseServer
      .from('leads')
      .update({ organization_id: orgId })
      .neq('organization_id', orgId);
    
    if (leadErrAll) console.log("Advertencia en leads:", leadErrAll);

    // Asignar agente a leads huérfanos
    await supabaseServer
      .from('leads')
      .update({ assigned_agent_id: adminId })
      .is('assigned_agent_id', null);
      
    console.log("Leads asignados correctamente.");
  }

  console.log("Data Backfill completado con éxito.");
}

main();
