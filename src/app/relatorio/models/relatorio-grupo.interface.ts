import {RelatorioCardConfig} from './relatorio-card.interface';

/**
 * Layout do grupo de relatórios.
 *
 * - `grid-2`: Dois cards lado a lado (para relatórios simples)
 * - `full-width`: Card em largura total (para relatórios com mais campos)
 */
export type LayoutGrupo = 'grid-2' | 'full-width';

/**
 * Configuração de um grupo de relatórios na interface.
 *
 * Os relatórios são organizados em grupos por frequência de uso e tipo de parâmetro:
 * - Consultas Rápidas: Relatórios sem parâmetros (1 clique)
 * - Por Usuário: Busca por RA/SIAPE
 * - Por Item: Busca por nome do item
 * - Por Período: Filtro por datas
 *
 * @example
 * const grupo: RelatorioGrupo = {
 *   id: 'consultas-rapidas',
 *   titulo: 'Consultas Rápidas',
 *   descricao: '1 clique para gerar',
 *   layout: 'grid-2',
 *   relatorios: [...]
 * };
 */
export interface RelatorioGrupo {
  /** Identificador único do grupo */
  id: string;

  /** Título exibido como header da seção */
  titulo: string;

  /** Descrição breve do grupo (ex: "1 clique para gerar") */
  descricao: string;

  /** Layout dos cards dentro do grupo */
  layout: LayoutGrupo;

  /** Lista de relatórios pertencentes ao grupo */
  relatorios: RelatorioCardConfig[];
}
