export type PipelineType = 'VENTAS' | 'CAPTACIONES' | 'ALQUILERES';

export type LeadType = 'BUYER' | 'SELLER_OWNER' | 'TENANT';

export type PipelineStage =
  // Embudo 1: Ventas (Compradores / Inversionistas)
  | 'NUEVO'
  | 'EN_CALIFICACION'
  | 'CALIFICADO_VISITA_PENDIENTE'
  | 'VISITA_AGENDADA'
  | 'VISITA_REALIZADA'
  | 'EN_NEGOCIACION'
  | 'CERRADO'
  // Embudo 2: Captación de Inmuebles (Propietarios)
  | 'PROSPECTO_PROPIETARIO'
  | 'EVALUACION_INMUEBLE'
  | 'ACM_ESTUDIO_MERCADO'
  | 'AUDITORIA_DOCUMENTAL'
  | 'CONTRATO_CONSIGNACION'
  | 'INMUEBLE_CAPTADO'
  // Embudo 3: Alquileres / Rentas
  | 'SOLICITUD_RENTA'
  | 'PERFILAMIENTO_INGRESOS'
  | 'VISITA_RENTA'
  | 'REVISION_GARANTIAS'
  | 'CONTRATO_RENTA_FIRMADO';

/** Roles de usuario en el sistema multi-tenant */
export type UserRole = 'superadmin' | 'agency_admin' | 'agent';

/** Vista activa en el SPA — controla el routing sin librerías externas */
export type AppView = 'login' | 'pipeline' | 'rag' | 'dashboard' | 'chat' | 'admin' | 'landing' | 'marketing';

/** Usuario autenticado de Supabase Auth */
export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  userType?: 'INDEPENDENT_AGENT' | 'REAL_ESTATE_AGENCY';
  phoneNumber?: string; // Para notificaciones push
}

export interface Organization {
  id: string;
  name: string;
  primaryCity?: string;
  modules?: {
    module_sofia_ia: boolean;
    module_bant_kanban: boolean;
    module_social_marketing: boolean;
    module_marketing_studio?: boolean;
    module_legal_audit: boolean;
    module_contract_generator: boolean;
  };
  ai_keywords?: string;
  gemini_api_key?: string;
  whatsapp_instance_id?: string;
  ai_config?: {
    systemRules: string;
    tone: string;
    fallbacks: string;
    defaultAgentPhone?: string; // Teléfono por defecto para Push Alerts
  };
}

export type PaymentMethod =
  | 'CREDITO_VIS'
  | 'CREDITO_BANCARIO'
  | 'CONTADO'
  | 'POR_DEFINIR';

export interface Property {
  id: string;
  organizationId: string;
  propertyCode?: string;
  title: string;
  city: string;
  zone: string;
  priceUsd: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  acceptsSocialHousing: boolean; // Compatible VIS / ASFI
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  rawDescription: string;
  featuresJson?: Record<string, unknown>;
  imageUrl?: string;
  images?: string[];
  vectorIndexed?: boolean;
  vectorDimensions?: number;
  legalAudit?: PropertyLegalAudit;
}

export interface BantScore {
  budget: number;
  authority: boolean;
  need: string;
  timeline: string;
  score: number; // 0 - 100
}

export interface PropertyLegalAudit {
  id: string;
  propertyId: string;
  city: string;
  folioRealStatus: 'AL_DIA' | 'CON_GRAVAMEN' | 'PENDIENTE';
  taxStatus: 'AL_DIA' | 'DEUDA' | 'PENDIENTE';
  cadastralStatus: 'APROBADO' | 'EN_TRAMITE' | 'NO_TIENE' | 'PENDIENTE';
  globalLegalScore: 'VERDE' | 'AMARILLO' | 'ROJO';
  notes?: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  phoneNumber: string;
  fullName: string;
  pipelineStage: PipelineStage;
  pipelineType?: PipelineType;
  leadType?: LeadType;
  sourceChannel?: string;
  budgetMaxUsd: number;
  paymentMethod: PaymentMethod;
  hasDownPayment: boolean; // Insignia Aporte Propio
  downPaymentPercent: number; // e.g. 15% or 20%
  downPaymentBank?: string; // e.g. "Banco BCP", "Banco Mercantil"
  preferredZone: string;
  propertyInterestId?: string;
  matchedProperty?: Property;
  assignedAgentId?: string;
  aiSummary: string;
  aiPaused: boolean;
  intentScore: number; // e.g. 95 (Hot Lead)
  bantScore?: BantScore;
  appointmentDate?: string;
  createdAt: string;
}

export interface FinancialQualification {
  maxBudgetUsd: number;
  paymentMethod: PaymentMethod;
  hasDownPayment: boolean;
  downPaymentPercent: number;
  bankName?: string;
  isVisQualified: boolean;
  score: number;
  summary: string;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'lead' | 'ai_sofia' | 'agent';
  text: string;
  timestamp: string;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
}
