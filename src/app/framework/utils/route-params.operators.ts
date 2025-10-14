import {OperatorFunction, pipe} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {Params} from '@angular/router';

/**
 * Configuração para extração de parâmetros da rota
 */
export interface RouteParamConfig<T> {
  /** Nome do parâmetro na rota */
  paramName: string;
  /** Função de conversão/validação do valor */
  converter: (value: string) => T | null;
  /** Valor padrão se conversão falhar */
  defaultValue?: T;
  /** Callback para logging de erros */
  onError?: (paramValue: string, error?: Error) => void;
}

/**
 * Extrai e valida um parâmetro da rota com tipo seguro
 *
 * ⚡ Características:
 * - Auto-unsubscribe com take(1)
 * - Type-safe com generics
 * - Validação de string vazia e whitespace
 * - Error handling com callback customizável
 * - Suporte a valor padrão
 *
 * @example
 * // Extrair ID numérico com error handling
 * this.route.params.pipe(
 *   extractRouteParam({
 *     paramName: 'id',
 *     converter: parseNumericId,
 *     onError: (value) => {
 *       this.logger.warn(`Invalid ID: ${value}`);
 *       this.back();
 *     }
 *   })
 * ).subscribe(id => {
 *   if (id !== null) this.edit(id);
 * });
 *
 * @example
 * // Extrair código string
 * this.route.params.pipe(
 *   extractRouteParam({
 *     paramName: 'code',
 *     converter: parseStringParam
 *   })
 * ).subscribe(code => {
 *   if (code) this.processCode(code);
 * });
 *
 * @example
 * // Com valor padrão
 * this.route.params.pipe(
 *   extractRouteParam({
 *     paramName: 'page',
 *     converter: parseNumericId,
 *     defaultValue: 1
 *   })
 * ).subscribe(page => {
 *   this.loadPage(page); // sempre number, nunca null
 * });
 */
export function extractRouteParam<T>(
  config: RouteParamConfig<T>
): OperatorFunction<Params, T | null> {
  return pipe(
    take(1), // Auto-unsubscribe após primeira emissão
    map((params: Params): T | null => {
      const rawValue = params[config.paramName];

      // Verifica se o parâmetro existe e não é vazio
      if (!rawValue || (typeof rawValue === 'string' && rawValue.trim() === '')) {
        return config.defaultValue ?? null;
      }

      try {
        const converted = config.converter(rawValue);

        if (converted === null && config.onError) {
          config.onError(rawValue);
        }

        return converted ?? config.defaultValue ?? null;
      } catch (error) {
        if (config.onError) {
          config.onError(rawValue, error as Error);
        }
        return config.defaultValue ?? null;
      }
    })
  );
}

/**
 * Conversor para IDs numéricos
 *
 * Valida que o valor é um número válido e não NaN.
 * Aceita decimais (12.34 → 12.34).
 *
 * @param value - String do parâmetro de rota
 * @returns Número convertido ou null se inválido
 *
 * @example
 * parseNumericId('123')    // → 123
 * parseNumericId('0')      // → 0
 * parseNumericId('12.34')  // → 12.34
 * parseNumericId('abc')    // → null
 * parseNumericId('')       // → null
 * parseNumericId('  ')     // → null
 */
export function parseNumericId(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

/**
 * Conversor para parâmetros string
 *
 * Remove espaços e valida que não está vazio.
 *
 * @param value - String do parâmetro de rota
 * @returns String trimmed ou null se vazio
 *
 * @example
 * parseStringParam('test')      // → 'test'
 * parseStringParam('  test  ')  // → 'test'
 * parseStringParam('')          // → null
 * parseStringParam('   ')       // → null
 */
export function parseStringParam(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '' ? trimmed : null;
}

/**
 * Conversor para códigos (string com validação adicional)
 *
 * Similar a parseStringParam mas pode ser estendido para validações
 * específicas como regex, length, formato, etc.
 *
 * @param value - String do parâmetro de rota
 * @returns String validada ou null
 *
 * @example
 * parseCodeParam('ABC123')  // → 'ABC123'
 * parseCodeParam('')        // → null
 */
export function parseCodeParam(value: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '') {
    return null;
  }

  // Adicionar validações específicas aqui se necessário
  // Exemplo: validar comprimento, formato, caracteres permitidos
  // if (!/^[A-Z0-9]+$/.test(trimmed)) return null;

  return trimmed;
}

/**
 * Conversor para IDs positivos (números > 0)
 *
 * Útil quando IDs devem ser estritamente positivos.
 *
 * @param value - String do parâmetro de rota
 * @returns Número positivo ou null
 *
 * @example
 * parsePositiveId('123')  // → 123
 * parsePositiveId('0')    // → null
 * parsePositiveId('-5')   // → null
 */
export function parsePositiveId(value: string): number | null {
  const num = parseNumericId(value);
  return num !== null && num > 0 ? num : null;
}

/**
 * Conversor para valores booleanos
 *
 * Aceita: 'true'/'false', '1'/'0', case-insensitive.
 *
 * @param value - String do parâmetro de rota
 * @returns Boolean ou null se inválido
 *
 * @example
 * parseBooleanParam('true')   // → true
 * parseBooleanParam('TRUE')   // → true
 * parseBooleanParam('1')      // → true
 * parseBooleanParam('false')  // → false
 * parseBooleanParam('0')      // → false
 * parseBooleanParam('yes')    // → null
 */
export function parseBooleanParam(value: string): boolean | null {
  const lower = value?.toLowerCase().trim();
  if (lower === 'true' || lower === '1') return true;
  if (lower === 'false' || lower === '0') return false;
  return null;
}
