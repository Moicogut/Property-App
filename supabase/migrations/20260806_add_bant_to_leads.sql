-- Agregar la columna bant_score a la tabla leads para alojar el BANT
ALTER TABLE "leads" ADD COLUMN "bant_score" jsonb DEFAULT '{"budget":0,"authority":false,"need":"","timeline":"","score":0}'::jsonb;
