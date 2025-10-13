/**
 * Tipos de parâmetros de rota suportados
 */
export type RouteParamType = 'number' | 'string' | 'code' | 'boolean' | 'positiveId';

/**
 * Mapeamento de tipos de parâmetros para tipos TypeScript
 */
export interface RouteParamTypeMap {
  number: number;
  string: string;
  code: string;
  boolean: boolean;
  positiveId: number;
}

/**
 * Validador de tipo para parâmetros de rota
 */
export interface RouteParamValidator<T extends RouteParamType> {
  /** Tipo do parâmetro */
  type: T;
  /** Função de validação */
  validate: (value: string) => RouteParamTypeMap[T] | null;
  /** Mensagem de erro padrão */
  errorMessage?: string;
}

/**
 * Resultado de extração de parâmetro com metadados
 */
export interface ParamExtractionResult<T> {
  /** Valor convertido (null se inválido) */
  value: T | null;
  /** Indica se a validação passou */
  isValid: boolean;
  /** Valor bruto da rota */
  rawValue: string;
}
