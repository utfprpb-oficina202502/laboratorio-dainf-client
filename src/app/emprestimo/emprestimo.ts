import {Usuario} from '../usuario/usuario';
import {EmprestimoItem} from './emprestimoItem';
import {EmprestimoDevolucaoItem} from './emprestimoDevolucaoItem';

/**
 * Status do empréstimo
 * - P: Pendente (em andamento, prazo não vencido)
 * - A: Atrasado (prazo vencido, não devolvido)
 * - F: Finalizado (devolvido)
 */
export type EmprestimoStatus = 'P' | 'A' | 'F';

export class Emprestimo {
  id!: number;
  dataEmprestimo!: string;
  prazoDevolucao!: string;
  dataDevolucao!: string;
  usuarioResponsavel!: Usuario;
  usuarioEmprestimo!: Usuario;
  emprestimoItem!: EmprestimoItem[];
  emprestimoDevolucaoItem!: EmprestimoDevolucaoItem[];
  observacao!: string;

  /** Nome do usuário do empréstimo (usado em listagens - DTO simplificado do backend) */
  usuarioEmprestimoNome?: string;

  /** Status do empréstimo calculado no frontend baseado em prazoDevolucao e dataDevolucao */
  status?: EmprestimoStatus;
}
