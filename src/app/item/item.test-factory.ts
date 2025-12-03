import {Item} from './item';
import {Grupo} from '../grupo/grupo';

/**
 * Factory para criação de objetos Item para testes
 * Fornece métodos semânticos para criar diferentes cenários de item
 */
export class ItemTestFactory {
  private static nextId = 1;

  /**
   * Cria um item básico com valores padrão
   * @param overrides Propriedades para sobrescrever valores padrão
   */
  static create(overrides: Partial<Item> = {}): Item {
    const item = new Item();
    item.id = overrides.id ?? this.nextId++;
    item.nome = overrides.nome ?? `Item de teste ${item.id}`;
    item.localizacao = overrides.localizacao ?? `Localização ${item.id}`;
    item.saldo = overrides.saldo ?? 10;
    item.patrimonio = overrides.patrimonio ?? 12345;
    item.siorg = overrides.siorg ?? 67890;
    item.valor = overrides.valor ?? 100.50;
    item.qtdeMinima = overrides.qtdeMinima ?? 1;
    item.tipoItem = overrides.tipoItem ?? 'Material';
    item.descricao = overrides.descricao ?? `Descrição do item ${item.id}`;

    // Criar grupo padrão se não fornecido
    if (!overrides.grupo) {
      item.grupo = {
        id: 1,
        descricao: 'Eletrônicos'
      } as Grupo;
    } else {
      item.grupo = overrides.grupo;
    }

    return item;
  }

  /**
   * Cria uma lista de itens para testes
   * @param count Número de itens a criar
   */
  static createList(count: number): Item[] {
    return Array.from({length: count}, (_, i) =>
      this.create({id: i + 1})
    );
  }

  /**
   * Cria um item inativo
   * @param overrides Propriedades adicionais
   */
  static createInativo(overrides: Partial<Item> = {}): Item {
    return this.create({
      ...overrides,
      nome: overrides.nome ?? `Item inativo ${this.nextId}`
    });
  }

  /**
   * Cria um item ativo (padrão)
   * @param overrides Propriedades adicionais
   */
  static createAtivo(overrides: Partial<Item> = {}): Item {
    return this.create({
      ...overrides,
      nome: overrides.nome ?? `Item ativo ${this.nextId}`
    });
  }

  /**
   * Cria um item com saldo zero
   * @param overrides Propriedades adicionais
   */
  static createSemSaldo(overrides: Partial<Item> = {}): Item {
    return this.create({
      ...overrides,
      saldo: 0,
      nome: overrides.nome ?? `Item sem saldo ${this.nextId}`
    });
  }

  /**
   * Cria um item com grupo específico
   * @param grupoId ID do grupo
   * @param grupoDescricao Descrição do grupo
   * @param overrides Propriedades adicionais
   */
  static createComGrupo(grupoId: number, grupoDescricao: string, overrides: Partial<Item> = {}): Item {
    return this.create({
      ...overrides,
      grupo: {
        id: grupoId,
        descricao: grupoDescricao
      } as Grupo
    });
  }

  /**
   * Reseta o contador de IDs (útil em beforeEach)
   */
  static resetIdCounter(): void {
    this.nextId = 1;
  }
}
