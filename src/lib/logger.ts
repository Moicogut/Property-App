/**
 * Módulo de Observabilidad y Logs Estructurados para CRM y Flujos de IA (OBS-01).
 * Correlaciona eventos por trace_id y organización.
 */

export interface StructuredLogContext {
  traceId?: string;
  organizationId?: string;
  leadId?: string;
  module?: string;
  action?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private static format(level: string, message: string, context?: StructuredLogContext): string {
    const timestamp = new Date().toISOString();
    const trace = context?.traceId ? `[Trace: ${context.traceId}]` : "";
    const org = context?.organizationId ? `[Org: ${context.organizationId}]` : "";
    const mod = context?.module ? `[${context.module}]` : "";

    return `${timestamp} ${level.padEnd(5)} ${trace}${org}${mod} ${message}`;
  }

  static info(message: string, context?: StructuredLogContext): void {
    console.log(this.format("INFO", message, context), context?.metadata ? JSON.stringify(context.metadata) : "");
  }

  static warn(message: string, context?: StructuredLogContext): void {
    console.warn(this.format("WARN", message, context), context?.metadata ? JSON.stringify(context.metadata) : "");
  }

  static error(message: string, error?: unknown, context?: StructuredLogContext): void {
    const errDetails = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { raw: error };
    console.error(this.format("ERROR", message, context), JSON.stringify({ ...context?.metadata, error: errDetails }));
  }

  static generateTraceId(): string {
    return `trc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
