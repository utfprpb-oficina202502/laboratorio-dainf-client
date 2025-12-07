import {Item} from '../item/item';
import {Emprestimo} from './emprestimo';

export class EmprestimoItem {
  id!: number;
  qtde!: number;
  devolver!: boolean;
  item!: Item;
  emprestimo!: Emprestimo;
  tempId?: string; // Temporary unique identifier for matching before backend persistence
}
