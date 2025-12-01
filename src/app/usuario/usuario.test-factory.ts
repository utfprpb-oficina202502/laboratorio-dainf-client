import {Usuario} from './usuario';
import {Permissao} from './permissao';

/**
 * Factory para criar dados de teste de Permissao
 */
export class PermissaoTestFactory {
  /**
   * Cria permissão com valores padrão
   * @param overrides Propriedades a sobrescrever
   * @returns Permissao mockada
   *
   * @example
   * const permissao = PermissaoTestFactory.create({nome: 'ROLE_ADMIN'});
   */
  static create(overrides?: Partial<Permissao>): Permissao {
    return {
      id: 1,
      nome: 'ROLE_ALUNO',
      ...overrides
    } as Permissao;
  }

  /**
   * Cria permissão de administrador
   */
  static createAdmin(): Permissao {
    return this.create({id: 1, nome: 'ROLE_ADMINISTRADOR'});
  }

  /**
   * Cria permissão de laboratorista
   */
  static createLaboratorista(): Permissao {
    return this.create({id: 2, nome: 'ROLE_LABORATORISTA'});
  }

  /**
   * Cria permissão de professor
   */
  static createProfessor(): Permissao {
    return this.create({id: 3, nome: 'ROLE_PROFESSOR'});
  }

  /**
   * Cria permissão de aluno
   */
  static createAluno(): Permissao {
    return this.create({id: 4, nome: 'ROLE_ALUNO'});
  }

  /**
   * Cria lista com todas as permissões do sistema
   */
  static createAll(): Permissao[] {
    return [
      this.createAdmin(),
      this.createLaboratorista(),
      this.createProfessor(),
      this.createAluno()
    ];
  }
}

/**
 * Factory para criar dados de teste de Usuario
 * Inclui métodos semânticos para cenários específicos
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
      documento: '123456',
      username: 'joao@email.com',
      password: 'senha123',
      email: 'joao@email.com',
      telefone: '41999999999',
      permissoes: [PermissaoTestFactory.createAluno()],
      fotoURL: '',
      ...overrides
    } as Usuario;
  }

  /**
   * Cria usuário aluno
   * @param overrides Propriedades a sobrescrever
   */
  static createAluno(overrides?: Partial<Usuario>): Usuario {
    return this.create({
      nome: 'Aluno Teste',
      documento: 'RA123456',
      permissoes: [PermissaoTestFactory.createAluno()],
      ...overrides
    });
  }

  /**
   * Cria usuário professor
   * @param overrides Propriedades a sobrescrever
   */
  static createProfessor(overrides?: Partial<Usuario>): Usuario {
    return this.create({
      nome: 'Professor Teste',
      documento: 'SIAPE123456',
      permissoes: [PermissaoTestFactory.createProfessor()],
      ...overrides
    });
  }

  /**
   * Cria usuário administrador
   * @param overrides Propriedades a sobrescrever
   */
  static createAdmin(overrides?: Partial<Usuario>): Usuario {
    return this.create({
      nome: 'Admin Teste',
      documento: 'SIAPE999999',
      permissoes: [PermissaoTestFactory.createAdmin()],
      ...overrides
    });
  }

  /**
   * Cria usuário laboratorista
   * @param overrides Propriedades a sobrescrever
   */
  static createLaboratorista(overrides?: Partial<Usuario>): Usuario {
    return this.create({
      nome: 'Laboratorista Teste',
      documento: 'SIAPE888888',
      permissoes: [PermissaoTestFactory.createLaboratorista()],
      ...overrides
    });
  }

  /**
   * Cria usuário novo (sem id) para testes de criação
   * @param overrides Propriedades a sobrescrever
   */
  static createNew(overrides?: Partial<Usuario>): Partial<Usuario> {
    const user = this.create(overrides);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {id, ...userWithoutId} = user;
    return userWithoutId;
  }

  /**
   * Cria lista de usuários com IDs sequenciais
   * @param count Quantidade de usuários (padrão: 3)
   * @returns Array de usuários
   *
   * @example
   * const usuarios = UsuarioTestFactory.createList(5);
   * expect(usuarios).toHaveLength(5);
   */
  static createList(count = 3): Usuario[] {
    return Array.from({length: count}, (_, i) =>
      this.create({
        id: i + 1,
        nome: `Usuário ${i + 1}`,
        email: `usuario${i + 1}@email.com`,
        username: `usuario${i + 1}@email.com`
      })
    );
  }
}
