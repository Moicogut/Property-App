export type PipelineStage =
  | 'NUEVO'
  | 'EN_CALIFICACION'
  | 'CALIFICADO_VISITA_PENDIENTE'
  | 'VISITA_AGENDADA'
  | 'VISITA_REALIZADA'
  | 'EN_NEGOCIACION'
  | 'CERRADO';

/** Roles de usuario en el sistema multi-tenant */
export type UserRole = 'superadmin' | 'agency_admin' | 'agent';

/** Vista activa en el SPA — controla el routing sin librerías externas */
export type AppView = 'login' | 'pipeline' | 'rag' | 'dashboard' | 'chat' | 'admin';

/** Usuario autenticado de Supabase Auth */
export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  ai_keywords?: string;
  gemini_api_key?: string;
  whatsapp_instance_id?: string;
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
  vectorIndexed?: boolean;
  vectorDimensions?: number;
}

export interface Lead {
  id: string;
  organizationId: string;
  phoneNumber: string;
  fullName: string;
  pipelineStage: PipelineStage;
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
