import {Emprestimo} from './emprestimo';
import {Usuario} from '../usuario/usuario';

/**
 * Factory para criar dados de teste de Emprestimo
 * Reduz duplicação na criação de mocks
 */
export class EmprestimoTestFactory {
  /**
   * Cria empréstimo com valores padrão
   * @param overrides Propriedades a sobrescrever
   * @returns Emprestimo mockado
   *
   * @example
   * const emprestimo = EmprestimoTestFactory.create({id: 5});
   */
  static create(overrides?: Partial<Emprestimo>): Emprestimo {
    return {
      id: 1,
      usuarioEmprestimo: {id: 1, nome: 'João Silva', username: 'joao'} as Usuario,
      dataEmprestimo: '15/01/2024',
      prazoDevolucao: '22/01/2024',
      dataDevolucao: undefined,
      ...overrides
    } as unknown as Emprestimo;
  }

  /**
   * Cria empréstimo atrasado (prazo vencido, não devolvido)
   * @param overrides Propriedades a sobrescrever
   * @returns Emprestimo atrasado
   *
   * @example
   * const atrasado = EmprestimoTestFactory.createAtrasado();
   * expect(component.getStatusEmprestimo(atrasado)).toBe('A');
   */
  static createAtrasado(overrides?: Partial<Emprestimo>): Emprestimo {
    return this.create({
      prazoDevolucao: '01/01/2020',
      dataDevolucao: undefined,
      ...overrides
    });
  }

  /**
   * Cria empréstimo pendente (prazo futuro, não devolvido)
   * @param overrides Propriedades a sobrescrever
   * @returns Emprestimo pendente
   *
   * @example
   * const pendente = EmprestimoTestFactory.createPendente();
   * expect(component.getStatusEmprestimo(pendente)).toBe('P');
   */
  static createPendente(overrides?: Partial<Emprestimo>): Emprestimo {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const day = String(futureDate.getDate()).padStart(2, '0');
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const year = futureDate.getFullYear();

    return this.create({
      prazoDevolucao: `${day}/${month}/${year}`,
      dataDevolucao: undefined,
      ...overrides
    });
  }

  /**
   * Cria empréstimo finalizado (já devolvido)
   * @param overrides Propriedades a sobrescrever
   * @returns Emprestimo finalizado
   *
   * @example
   * const finalizado = EmprestimoTestFactory.createFinalizado();
   * expect(component.getStatusEmprestimo(finalizado)).toBe('F');
   */
  static createFinalizado(overrides?: Partial<Emprestimo>): Emprestimo {
    return this.create({
      prazoDevolucao: '20/01/2024',
      dataDevolucao: '14/01/2024',
      ...overrides
    });
  }

  /**
   * Cria lista de empréstimos com IDs sequenciais
   * @param count Quantidade de empréstimos (padrão: 3)
   * @returns Array de empréstimos
   *
   * @example
   * const emprestimos = EmprestimoTestFactory.createList(5);
   * expect(emprestimos).toHaveLength(5);
   */
  static createList(count: number = 3): Emprestimo[] {
    return Array.from({length: count}, (_, i) =>
      this.create({
        id: i + 1,
        usuarioEmprestimo: {
          id: i + 1,
          nome: `Usuário ${i + 1}`,
          username: `user${i + 1}`
        } as Usuario
      })
    );
  }
}

/**
 * Factory para criar dados de teste de Usuario
 */
export class UsuarioTestFactory {
  /**
   * Cria usuário com valores padrão
   * @param overrides Propriedades a sobrescrever
   * @returns Usuario mockado
   *
   * @example
   * const usuario = UsuarioTestFactory.create({nome: 'Maria'});
   */
  static create(overrides?: Partial<Usuario>): Usuario {
    return {
      id: 1,
      nome: 'João Silva',
      username: 'joao',
      ...overrides
    } as Usuario;
  }

  /**
   * Cria lista de usuários com IDs sequenciais
   * @param count Quantidade de usuários (padrão: 2)
   * @returns Array de usuários
   *
   * @example
   * const usuarios = UsuarioTestFactory.createList(3);
   */
  static createList(count: number = 2): Usuario[] {
    return Array.from({length: count}, (_, i) =>
      this.create({
        id: i + 1,
        nome: `Usuário ${i + 1}`,
        username: `user${i + 1}`
      })
    );
  }
}
