import {Relatorio} from './relatorio';

/**
 * Factory para criação de objetos Relatorio para testes
 * Fornece métodos semânticos para criar diferentes cenários de relatório
 */
export class RelatorioTestFactory {
  private static nextId = 1;

  /**
   * Cria um relatório básico com valores padrão
   * @param overrides Propriedades para sobrescrever valores padrão
   */
  static create(overrides: Partial<Relatorio> = {}): Relatorio {
    const relatorio = new Relatorio();
    relatorio.id = overrides.id ?? this.nextId++;
    relatorio.nome = overrides.nome ?? `Relatório de teste ${relatorio.id}`;
    relatorio.nameReport = overrides.nameReport ?? `report_${relatorio.id}`;
    relatorio.paramsList = overrides.paramsList ?? [];

    return relatorio;
  }

  /**
   * Cria uma lista de relatórios para testes
   * @param count Número de relatórios a criar
   */
  static createList(count: number): Relatorio[] {
    return Array.from({length: count}, (_, i) =>
      this.create({id: i + 1})
    );
  }

  /**
   * Cria um relatório inativo
   * @param overrides Propriedades adicionais
   */
  static createInativo(overrides: Partial<Relatorio> = {}): Relatorio {
    return this.create({
      ...overrides,
      nome: overrides.nome ?? `Relatório inativo ${this.nextId}`
    });
  }

  /**
   * Cria um relatório ativo (padrão)
   * @param overrides Propriedades adicionais
   */
  static createAtivo(overrides: Partial<Relatorio> = {}): Relatorio {
    return this.create({
      ...overrides,
      nome: overrides.nome ?? `Relatório ativo ${this.nextId}`
    });
  }

  /**
   * Reseta o contador de IDs (útil em beforeEach)
   */
  static resetIdCounter(): void {
    this.nextId = 1;
  }
}
