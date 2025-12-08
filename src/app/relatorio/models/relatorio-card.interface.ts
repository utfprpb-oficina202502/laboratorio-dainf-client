import {FormatoRelatorio} from './formato-relatorio.type';

/**
 * Tipos de campo suportados nos formulários de relatório.
 */
export type TipoCampo = 'texto' | 'data' | 'item-autocomplete';

/**
 * Configuração de um campo de parâmetro para relatório.
 *
 * @example
 * const campoDocumento: CampoConfig = {
 *   nome: 'documento',
 *   label: 'Documento (RA/SIAPE)',
 *   tipo: 'texto',
 *   obrigatorio: true,
 *   placeholder: 'Ex: 12345678'
 * };
 */
export interface CampoConfig {
  /** Nome do campo (usado como key nos parâmetros) */
  nome: string;

  /** Label exibido para o usuário */
  label: string;

  /** Tipo de input a ser renderizado */
  tipo: TipoCampo;

  /** Se o campo é obrigatório */
  obrigatorio: boolean;

  /** Placeholder do input */
  placeholder?: string;

  /** Validação customizada (regex pattern) */
  pattern?: string;

  /** Mensagem de erro customizada */
  mensagemErro?: string;
}

/**
 * Atalhos de período disponíveis para relatórios com filtro de datas.
 */
export type AtalhoPeriodo =
  'ultimos30dias'
  | 'esteMes'
  | 'ultimoMes'
  | 'ultimoTrimestre'
  | 'esteAno';

/**
 * Configuração completa de um card de relatório.
 *
 * @example
 * const config: RelatorioCardConfig = {
 *   id: 'historico-emprestimo',
 *   titulo: 'Histórico de Empréstimo',
 *   descricao: 'Todos os empréstimos de um usuário',
 *   icone: 'pi-history',
 *   cor: '#3B82F6',
 *   campos: [...]
 * };
 */
export interface RelatorioCardConfig {
  /** Identificador único do relatório (usado para persistência) */
  id: string;

  /** Título exibido no header do card */
  titulo: string;

  /** Descrição breve do relatório */
  descricao: string;

  /** Classe de ícone PrimeNG (ex: 'pi-history') */
  icone: string;

  /** Cor de destaque do card (hex color) */
  cor: string;

  /** Lista de campos de parâmetro (vazio = relatório sem parâmetros) */
  campos: CampoConfig[];

  /** Atalhos de período disponíveis (apenas para relatórios com campos de data) */
  atalhosPeriodo?: AtalhoPeriodo[];
}

/**
 * Valores preenchidos em um formulário de relatório.
 */
export type RelatorioFormValues = Record<string, unknown>;

/**
 * Evento emitido quando o usuário solicita a geração de um relatório.
 */
export interface GerarRelatorioEvent {
  /** ID do relatório */
  relatorioId: string;

  /** Formato de saída */
  formato: FormatoRelatorio;

  /** Valores dos campos preenchidos */
  valores: RelatorioFormValues;
}
