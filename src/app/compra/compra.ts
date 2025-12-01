import {Fornecedor} from '../fornecedor/fornecedor';
import {CompraItem} from './compraItem';
import {Usuario} from '../usuario/usuario';

export class Compra {
  id!: number;
  dataCompra!: string;
  fornecedor!: Fornecedor;
  compraItem!: CompraItem[];
  usuario!: Usuario;

  /** Nome fantasia do fornecedor (usado em listagens - DTO simplificado do backend) */
  fornecedorNomeFantasia?: string;

  /** Razão social do fornecedor (usado em listagens - DTO simplificado do backend) */
  fornecedorRazaoSocial?: string;
}
