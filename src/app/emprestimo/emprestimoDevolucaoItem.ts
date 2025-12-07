import {Item} from '../item/item';
import {Emprestimo} from './emprestimo';

export class EmprestimoDevolucaoItem {
  id!: number;
  qtde!: number;
  statusDevolucao!: StatusDevolucao;
  item!: Item;
  emprestimo!: Emprestimo;
  tempId?: string; // Temporary unique identifier for matching with EmprestimoItem
}

export enum StatusDevolucao {
  P = 'P',
  D = 'D',
  S = 'S'
}
