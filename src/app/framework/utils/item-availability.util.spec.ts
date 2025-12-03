import {ItemAvailabilityUtil} from './item-availability.util';
import {Item} from '../../item/item';

describe('ItemAvailabilityUtil', () => {
  /**
   * Cria um item de teste com valores padrão.
   */
  function createTestItem(overrides: Partial<Item> = {}): Item {
    return {
      id: 1,
      nome: 'Item Teste',
      patrimonio: 12345,
      siorg: 67890,
      valor: 100,
      qtdeMinima: 1,
      localizacao: 'Sala A1',
      tipoItem: 'MATERIAL',
      saldo: 10,
      descricao: 'Item de teste',
      grupo: {id: 1, descricao: 'Grupo Teste'},
      imageItem: [],
      disponivelEmprestimoCalculado: 8,
      quantidadeEmprestada: 2,
      ...overrides
    } as Item;
  }

  describe('getDisponibilidade', () => {
    it('deve retornar disponivelEmprestimoCalculado quando disponível', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5, saldo: 10});

      expect(ItemAvailabilityUtil.getDisponibilidade(item)).toBe(5);
    });

    it('deve retornar saldo como fallback quando disponivelEmprestimoCalculado não existe', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: undefined, saldo: 10});

      expect(ItemAvailabilityUtil.getDisponibilidade(item)).toBe(10);
    });

    it('deve retornar 0 quando item é null', () => {
      expect(ItemAvailabilityUtil.getDisponibilidade(null)).toBe(0);
    });

    it('deve retornar 0 quando item é undefined', () => {
      expect(ItemAvailabilityUtil.getDisponibilidade(undefined)).toBe(0);
    });

    it('deve retornar 0 quando disponivelEmprestimoCalculado e saldo são undefined', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: undefined, saldo: undefined});

      expect(ItemAvailabilityUtil.getDisponibilidade(item)).toBe(0);
    });

    it('deve retornar 0 quando disponivelEmprestimoCalculado é 0', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 0, saldo: 10});

      expect(ItemAvailabilityUtil.getDisponibilidade(item)).toBe(0);
    });
  });

  describe('getAvailabilitySeverity', () => {
    it('deve retornar danger quando disponibilidade é 0', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 0});

      expect(ItemAvailabilityUtil.getAvailabilitySeverity(item)).toBe('danger');
    });

    it('deve retornar warn quando disponibilidade é 1', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 1});

      expect(ItemAvailabilityUtil.getAvailabilitySeverity(item)).toBe('warn');
    });

    it('deve retornar warn quando disponibilidade é 2', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 2});

      expect(ItemAvailabilityUtil.getAvailabilitySeverity(item)).toBe('warn');
    });

    it('deve retornar success quando disponibilidade é 3 ou mais', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 3});

      expect(ItemAvailabilityUtil.getAvailabilitySeverity(item)).toBe('success');
    });

    it('deve retornar success quando disponibilidade é alta', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 100});

      expect(ItemAvailabilityUtil.getAvailabilitySeverity(item)).toBe('success');
    });

    it('deve retornar danger para item null', () => {
      expect(ItemAvailabilityUtil.getAvailabilitySeverity(null)).toBe('danger');
    });

    it('deve retornar danger para item undefined', () => {
      expect(ItemAvailabilityUtil.getAvailabilitySeverity(undefined)).toBe('danger');
    });
  });

  describe('getMaxToAdd', () => {
    it('deve calcular corretamente o máximo que pode ser adicionado', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 10});

      expect(ItemAvailabilityUtil.getMaxToAdd(item, 3)).toBe(7);
    });

    it('deve retornar 0 quando carrinho já está cheio', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5});

      expect(ItemAvailabilityUtil.getMaxToAdd(item, 5)).toBe(0);
    });

    it('deve retornar 0 quando carrinho excede disponibilidade', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5});

      expect(ItemAvailabilityUtil.getMaxToAdd(item, 10)).toBe(0);
    });

    it('deve retornar disponibilidade total quando carrinho está vazio', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 8});

      expect(ItemAvailabilityUtil.getMaxToAdd(item, 0)).toBe(8);
    });

    it('deve retornar 0 para item null', () => {
      expect(ItemAvailabilityUtil.getMaxToAdd(null, 0)).toBe(0);
    });
  });

  describe('hasAvailability', () => {
    it('deve retornar true quando há disponibilidade', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 10});

      expect(ItemAvailabilityUtil.hasAvailability(item, 5)).toBe(true);
    });

    it('deve retornar false quando não há disponibilidade', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5});

      expect(ItemAvailabilityUtil.hasAvailability(item, 5)).toBe(false);
    });

    it('deve retornar false para item null', () => {
      expect(ItemAvailabilityUtil.hasAvailability(null)).toBe(false);
    });

    it('deve usar 0 como valor padrão para inCartQuantity', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5});

      expect(ItemAvailabilityUtil.hasAvailability(item)).toBe(true);
    });
  });

  describe('formatDisponibilidade', () => {
    it('deve formatar singular corretamente', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 1});

      expect(ItemAvailabilityUtil.formatDisponibilidade(item)).toBe('1 unidade');
    });

    it('deve formatar plural corretamente', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 5});

      expect(ItemAvailabilityUtil.formatDisponibilidade(item)).toBe('5 unidades');
    });

    it('deve formatar zero como plural', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 0});

      expect(ItemAvailabilityUtil.formatDisponibilidade(item)).toBe('0 unidades');
    });

    it('deve retornar "0 unidades" para item null', () => {
      expect(ItemAvailabilityUtil.formatDisponibilidade(null)).toBe('0 unidades');
    });
  });
});
