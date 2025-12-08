import {RelatorioGrupo} from '../models/relatorio-grupo.interface';

/**
 * Configuração dos grupos de relatórios organizados por frequência de uso.
 *
 * A ordem dos grupos reflete a prioridade de uso:
 * 1. Consultas Rápidas - Uso diário por laboratoristas (1 clique)
 * 2. Consulta por Usuário - Verificação de histórico no atendimento
 * 3. Consultas por Item - Análise de reservas e solicitações
 * 4. Consulta por Período - Relatórios gerenciais (uso pontual)
 *
 * @example
 * // Iterando sobre os grupos no template
 * @for (grupo of RELATORIOS_GRUPOS; track grupo.id) {
 *   <app-relatorio-grupo [grupo]="grupo" />
 * }
 */
export const RELATORIOS_GRUPOS: RelatorioGrupo[] = [
  {
    id: 'consultas-rapidas',
    titulo: 'Consultas Rápidas',
    descricao: '1 clique para gerar',
    layout: 'grid-2',
    relatorios: [
      {
        id: 'itens-sem-estoque',
        titulo: 'Itens Sem Estoque',
        descricao: 'Itens com saldo igual a zero',
        icone: 'pi-inbox',
        cor: '#F97316',
        campos: []
      },
      {
        id: 'itens-qtde-minima',
        titulo: 'Itens Qtde Mínima',
        descricao: 'Itens abaixo da quantidade mínima',
        icone: 'pi-exclamation-triangle',
        cor: '#EF4444',
        campos: []
      }
    ]
  },
  {
    id: 'consulta-usuario',
    titulo: 'Consulta por Usuário',
    descricao: 'Buscar por RA ou SIAPE',
    layout: 'full-width',
    relatorios: [
      {
        id: 'historico-emprestimo',
        titulo: 'Histórico de Empréstimo do Usuário',
        descricao: 'Todos os empréstimos de um aluno ou professor',
        icone: 'pi-history',
        cor: '#3B82F6',
        campos: [
          {
            nome: 'documento',
            label: 'Documento (RA/SIAPE)',
            tipo: 'texto',
            obrigatorio: true,
            placeholder: 'Ex: 12345678',
            pattern: '^[0-9]{6,}$',
            mensagemErro: 'Digite pelo menos 6 números'
          }
        ]
      }
    ]
  },
  {
    id: 'consultas-item',
    titulo: 'Consultas por Item',
    descricao: 'Buscar por nome do item',
    layout: 'grid-2',
    relatorios: [
      {
        id: 'reservas-item',
        titulo: 'Reservas de Item',
        descricao: 'Todas as reservas de um item',
        icone: 'pi-bookmark',
        cor: '#8B5CF6',
        campos: [
          {
            nome: 'item',
            label: 'Item',
            tipo: 'item-autocomplete',
            obrigatorio: true,
            placeholder: 'Digite pelo menos 2 caracteres...'
          }
        ]
      },
      {
        id: 'solicitacoes-item',
        titulo: 'Solicitações de Item',
        descricao: 'Solicitações de compra de um item',
        icone: 'pi-shopping-cart',
        cor: '#10B981',
        campos: [
          {
            nome: 'item',
            label: 'Item',
            tipo: 'item-autocomplete',
            obrigatorio: true,
            placeholder: 'Digite pelo menos 2 caracteres...'
          }
        ]
      }
    ]
  },
  {
    id: 'consulta-periodo',
    titulo: 'Consulta por Período',
    descricao: 'Filtrar por datas',
    layout: 'full-width',
    relatorios: [
      {
        id: 'emprestimos-realizados',
        titulo: 'Empréstimos Realizados',
        descricao: 'Empréstimos em um período (máximo 2 anos)',
        icone: 'pi-calendar',
        cor: '#3B82F6',
        campos: [
          {
            nome: 'dataInicio',
            label: 'Data Início',
            tipo: 'data',
            obrigatorio: true
          },
          {
            nome: 'dataFim',
            label: 'Data Fim',
            tipo: 'data',
            obrigatorio: true
          }
        ],
        atalhosPeriodo: ['ultimos30dias', 'esteMes', 'ultimoMes']
      }
    ]
  }
];

/**
 * Mapa de IDs de relatório para facilitar busca.
 */
export const RELATORIOS_MAP = RELATORIOS_GRUPOS
.flatMap(grupo => grupo.relatorios)
.reduce((map, relatorio) => {
  map[relatorio.id] = relatorio;
  return map;
}, {} as Record<string, typeof RELATORIOS_GRUPOS[0]['relatorios'][0]>);

/**
 * Lista flat de todos os relatórios.
 */
export const TODOS_RELATORIOS = RELATORIOS_GRUPOS.flatMap(grupo => grupo.relatorios);
