/**
 * Interfaz base para el patrón Strategy de Proveedores de Embeddings.
 * Permite intercambiar fácilmente entre Gemini, OpenAI, u otros proveedores
 * sin acoplar la lógica de negocio a un SDK específico.
 */
export interface EmbeddingProvider {
  /** Nombre identificador del proveedor (ej. 'gemini', 'openai') */
  readonly providerName: string;
  
  /** Modelo exacto utilizado para generar el vector (ej. 'text-embedding-004') */
  readonly modelName: string;
  
  /** Cantidad de dimensiones del vector resultante */
  readonly dimensions: number;

  /**
   * Genera el embedding numérico a partir del texto de entrada.
   * @param text Texto a vectorizar.
   * @returns Un array de números (vector flotante).
   */
  generateEmbedding(text: string): Promise<number[]>;
}
