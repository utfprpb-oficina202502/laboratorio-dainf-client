import {Usuario} from '../usuario/usuario';
import {SaidaItem} from './saidaItem';

export class Saida {
  id!: number;
  dataSaida!: string;
  observacao!: string;
  qtde!: number;
  usuarioResponsavel!: Usuario;
  saidaItem!: SaidaItem[];
  idEmprestimo!: number;

  /** Nome do usuário responsável (usado em listagens - DTO simplificado do backend) */
  nomeUsuarioResponsavel?: string;

  /** Quantidade total de itens (usado em listagens - DTO simplificado do backend) */
  qtdeTotal?: number;
}
