import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ConfirmationService, MessageService} from 'primeng/api';
import {EmprestimoDevolucaoComponent} from './emprestimo.devolucao.component';
import {EmprestimoService} from './emprestimo.service';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import {Emprestimo} from './emprestimo';
import {Item} from '../item/item';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';
import {CdkDragDrop} from '@angular/cdk/drag-drop';

// Polyfill para structuredClone no ambiente de testes Node.js
// Implementação simplificada que evita referências circulares
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => {
    // Para testes, simplesmente clona sem o emprestimo para evitar circular ref
    const {emprestimo, ...rest} = obj;
    return {
      ...rest,
      emprestimo: emprestimo // Mantém referência original (não clona)
    };
  };
}

// ============================================================================
// Shared Test Utilities
// ============================================================================

// ============================================================================
// Shared Test Utilities
// ============================================================================



/**
 * Cria e retorna uma instância configurada do componente com empréstimo vazio
 */
function createComponentWithEmprestimo(): {
  component: EmprestimoDevolucaoComponent;
  emprestimo: Emprestimo
} {
  TestBed.configureTestingModule({
    imports: [EmprestimoDevolucaoComponent],
    providers: [
      provideRouter([]),
      MessageService,
      ConfirmationService,
      {provide: EmprestimoService, useValue: {}},
      {provide: LoaderService, useValue: {}},
      {provide: LoginService, useValue: {}},
      {provide: LoggerService, useValue: {}},
    ],
  });

  const fixture = TestBed.createComponent(EmprestimoDevolucaoComponent);
  const component = fixture.componentInstance;

  const emprestimo = {
    emprestimoDevolucaoItem: []
  } as unknown as Emprestimo;
  component.emprestimo.set(emprestimo);

  return {component, emprestimo};
}

/**
 * Factory para criar objetos Item de teste
 */
function createItem(itemId: number, itemDesc?: string): Item {
  return {
    id: itemId,
    descricao: itemDesc ?? `Item ${itemId}`
  } as Item;
}

/**
 * Factory para criar objetos EmprestimoDevolucaoItem de teste
 * IMPORTANTE: O emprestimo precisa ser passado como parâmetro para evitar closure sobre variável mutável
 */
function createDevolucaoItem(
  emprestimo: Emprestimo,
  id: number | null,
  itemId: number,
  qtde: number,
  status: StatusDevolucao = StatusDevolucao.P
): EmprestimoDevolucaoItem {
  return {
    id: id,
    qtde: qtde,
    statusDevolucao: status,
    item: createItem(itemId),
    emprestimo: emprestimo
  } as EmprestimoDevolucaoItem;
}

describe('EmprestimoDevolucaoComponent - removeItensDuplicadosByItem', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {
    ({component, emprestimo} = createComponentWithEmprestimo());
  });

  describe('Consolidação de quantidades', () => {
    it('deve consolidar quantidades de todas as duplicatas em todas as listas', () => {
      // Arrange: Item original + 2 duplicatas espalhadas nas listas
      const itemOriginal = createDevolucaoItem(emprestimo, 1, 100, 5, StatusDevolucao.P);
      const duplicata1 = createDevolucaoItem(emprestimo, 0, 100, 2, StatusDevolucao.D);
      const duplicata2 = createDevolucaoItem(emprestimo, null, 100, 3, StatusDevolucao.S);

      emprestimo.emprestimoDevolucaoItem = [itemOriginal, duplicata1, duplicata2];
      component.itensPendentes.set([itemOriginal]);
      component.itensDevolvidos.set([duplicata1]);
      component.itensSaida.set([duplicata2]);

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Quantidade total = 5 + 2 + 3 = 10
      expect(itemOriginal.qtde).toBe(10);
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
      expect(emprestimo.emprestimoDevolucaoItem[0]).toBe(itemOriginal);
    });

    it('deve consolidar quantidades quando há múltiplas duplicatas na mesma coluna', () => {
      // Arrange: 1 original + 3 duplicatas todas pendentes
      const itemOriginal = createDevolucaoItem(emprestimo, 1, 100, 10);
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 2);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 3);
      const dup3 = createDevolucaoItem(emprestimo, null, 100, 5);

      emprestimo.emprestimoDevolucaoItem = [itemOriginal, dup1, dup2, dup3];
      component.itensPendentes.set([itemOriginal, dup1, dup2, dup3]);

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: 10 + 2 + 3 + 5 = 20
      expect(itemOriginal.qtde).toBe(20);
      expect(component.itensPendentes()).toHaveLength(1);
      expect(component.itensPendentes()[0]).toBe(itemOriginal);
    });
  });

  describe('Seleção de item canônico', () => {
    it('deve manter item canônico (id > 0) quando presente', () => {
      // Arrange: Item original com id válido + duplicatas
      const itemOriginal = createDevolucaoItem(emprestimo, 5, 100, 7);
      const duplicata1 = createDevolucaoItem(emprestimo, 0, 100, 3);
      const duplicata2 = createDevolucaoItem(emprestimo, null, 100, 2);

      emprestimo.emprestimoDevolucaoItem = [duplicata1, itemOriginal, duplicata2];
      component.itensPendentes.set([duplicata1, itemOriginal, duplicata2]);

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Item canônico (id=5) deve ser mantido
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
      expect(emprestimo.emprestimoDevolucaoItem[0].id).toBe(5);
      expect(emprestimo.emprestimoDevolucaoItem[0].qtde).toBe(12); // 7 + 3 + 2
    });

    it('deve usar primeira duplicata como canônico quando não há item original', () => {
      // Arrange: Apenas duplicatas (todos com id = 0 ou null)
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 4);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 3);
      const dup3 = createDevolucaoItem(emprestimo, null, 100, 2);

      emprestimo.emprestimoDevolucaoItem = [dup1, dup2, dup3];
      component.itensPendentes.set([dup1, dup2, dup3]);

      // Act
      component.removeItensDuplicadosByItem(dup1);

      // Assert: Primeira duplicata (dup1) deve ser mantida como canônica
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
      expect(emprestimo.emprestimoDevolucaoItem[0]).toBe(dup1);
      expect(dup1.qtde).toBe(9); // 4 + 3 + 2
    });
  });

  describe('Remoção de duplicatas de todas as listas', () => {
    it('deve remover duplicatas das 4 listas do Kanban', () => {
      // Arrange: Duplicatas espalhadas por todas as listas
      const itemOriginal = createDevolucaoItem(emprestimo, 1, 100, 5, StatusDevolucao.P);
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 2, StatusDevolucao.P);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 3, StatusDevolucao.D);
      const dup3 = createDevolucaoItem(emprestimo, null, 100, 4, StatusDevolucao.S);

      emprestimo.emprestimoDevolucaoItem = [itemOriginal, dup1, dup2, dup3];
      component.itensPendentes.set([itemOriginal, dup1]);
      component.itensDevolvidos.set([dup2]);
      component.itensSaida.set([dup3]);

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Todas as listas devem conter apenas o item original
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
      expect(emprestimo.emprestimoDevolucaoItem[0]).toBe(itemOriginal);

      expect(component.itensPendentes()).toHaveLength(1);
      expect(component.itensPendentes()[0]).toBe(itemOriginal);

      expect(component.itensDevolvidos()).toHaveLength(0);
      expect(component.itensSaida()).toHaveLength(0);
    });

    it('deve remover apenas duplicatas do item específico, mantendo outros itens', () => {
      // Arrange: Duplicatas do item 100 + item 200 diferente
      const item100Original = createDevolucaoItem(emprestimo, 1, 100, 5);
      const item100Dup = createDevolucaoItem(emprestimo, 0, 100, 3);
      const item200 = createDevolucaoItem(emprestimo, 2, 200, 7);

      emprestimo.emprestimoDevolucaoItem = [item100Original, item100Dup, item200];
      component.itensPendentes.set([item100Original, item100Dup, item200]);

      // Act
      component.removeItensDuplicadosByItem(item100Original);

      // Assert: Item 200 deve ser mantido intacto
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(2);
      expect(emprestimo.emprestimoDevolucaoItem).toContain(item100Original);
      expect(emprestimo.emprestimoDevolucaoItem).toContain(item200);
      expect(emprestimo.emprestimoDevolucaoItem).not.toContain(item100Dup);

      expect(item200.qtde).toBe(7); // Quantidade do item 200 inalterada
    });
  });

  describe('Tratamento de casos especiais', () => {
    it('deve retornar early quando não há duplicatas', () => {
      // Arrange: Apenas item original sem duplicatas
      const itemOriginal = createDevolucaoItem(emprestimo, 1, 100, 5);

      emprestimo.emprestimoDevolucaoItem = [itemOriginal];
      component.itensPendentes.set([itemOriginal]);

      const qtdeOriginal = itemOriginal.qtde;

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Nada deve mudar
      expect(itemOriginal.qtde).toBe(qtdeOriginal);
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
    });

    it('deve lidar com lista vazia', () => {
      // Arrange: Listas vazias
      const itemTest = createDevolucaoItem(emprestimo, 1, 100, 5);

      // Act
      component.removeItensDuplicadosByItem(itemTest);

      // Assert: Não deve gerar erro
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(0);
    });

    it('deve lidar com único item duplicado', () => {
      // Arrange: Apenas uma duplicata, sem original
      const duplicata = createDevolucaoItem(emprestimo, 0, 100, 5);

      emprestimo.emprestimoDevolucaoItem = [duplicata];
      component.itensPendentes.set([duplicata]);

      // Act
      component.removeItensDuplicadosByItem(duplicata);

      // Assert: Duplicata deve se tornar canônica e permanecer
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
      expect(emprestimo.emprestimoDevolucaoItem[0]).toBe(duplicata);
      expect(duplicata.qtde).toBe(5);
    });

    it('deve lidar com duplicatas spread entre múltiplas colunas Kanban', () => {
      // Arrange: Simula drag-drop - duplicatas em colunas diferentes
      const original = createDevolucaoItem(emprestimo, 1, 100, 10, StatusDevolucao.P);
      const dupPendente = createDevolucaoItem(emprestimo, 0, 100, 5, StatusDevolucao.P);
      const dupDevolvido = createDevolucaoItem(emprestimo, 0, 100, 3, StatusDevolucao.D);
      const dupSaida = createDevolucaoItem(emprestimo, null, 100, 2, StatusDevolucao.S);

      emprestimo.emprestimoDevolucaoItem = [original, dupPendente, dupDevolvido, dupSaida];
      component.itensPendentes.set([original, dupPendente]);
      component.itensDevolvidos.set([dupDevolvido]);
      component.itensSaida.set([dupSaida]);

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: Original consolidado, outras colunas limpas
      expect(original.qtde).toBe(20); // 10 + 5 + 3 + 2
      expect(component.itensPendentes()).toEqual([original]);
      expect(component.itensDevolvidos()).toEqual([]);
      expect(component.itensSaida()).toEqual([]);
    });
  });

  describe('Integridade de dados', () => {
    it('deve manter referências corretas após remoção', () => {
      // Arrange
      const original = createDevolucaoItem(emprestimo, 1, 100, 5);
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 2);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 3);

      emprestimo.emprestimoDevolucaoItem = [original, dup1, dup2];
      component.itensPendentes.set([original, dup1, dup2]);

      // Captura referência antes da remoção
      const originalRef = original;

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: Mesma referência do objeto deve ser mantida
      expect(emprestimo.emprestimoDevolucaoItem[0]).toBe(originalRef);
      expect(component.itensPendentes()[0]).toBe(originalRef);
    });

    it('deve somar quantidades corretamente com valores decimais', () => {
      // Arrange: Quantidades com decimais
      const original = createDevolucaoItem(emprestimo, 1, 100, 5.5);
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 2.3);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 1.2);

      emprestimo.emprestimoDevolucaoItem = [original, dup1, dup2];
      component.itensPendentes.set([original, dup1, dup2]);

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: 5.5 + 2.3 + 1.2 = 9.0
      expect(original.qtde).toBe(9.0);
    });

    it('deve preservar outras propriedades do item canônico', () => {
      // Arrange
      const original = createDevolucaoItem(emprestimo, 1, 100, 5, StatusDevolucao.D);
      const dup = createDevolucaoItem(emprestimo, 0, 100, 3, StatusDevolucao.P);

      emprestimo.emprestimoDevolucaoItem = [original, dup];
      component.itensPendentes.set([dup]);
      component.itensDevolvidos.set([original]);

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: Status e outros campos do original mantidos
      expect(original.statusDevolucao).toBe(StatusDevolucao.D);
      expect(original.id).toBe(1);
      expect(original.item.id).toBe(100);
    });
  });

  describe('Cenários complexos de negócio', () => {
    it('deve consolidar após usuário arrastar duplicata entre colunas', () => {
      // Arrange: Simula fluxo do usuário
      // 1. Item original criado (id=1, qtde=10) → ajustado para 5 após duplicação
      const original = createDevolucaoItem(emprestimo, 1, 100, 5, StatusDevolucao.P);

      // 2. Usuário duplica item (id=0, qtde=5) → arrastado para "Devolvidos"
      const duplicata = createDevolucaoItem(emprestimo, 0, 100, 5, StatusDevolucao.D);

      emprestimo.emprestimoDevolucaoItem = [original, duplicata];
      component.itensPendentes.set([original]);
      component.itensDevolvidos.set([duplicata]);

      // Act: Usuário remove duplicatas
      component.removeItensDuplicadosByItem(original);

      // Assert: Quantidade total restaurada no original
      expect(original.qtde).toBe(10); // 5 + 5 = 10
      expect(component.itensPendentes()).toEqual([original]);
      expect(component.itensDevolvidos()).toEqual([]);
    });

    it('deve lidar com múltiplas duplicações sucessivas', () => {
      // Arrange: Usuário duplicou 3 vezes do mesmo item
      const original = createDevolucaoItem(emprestimo, 1, 100, 4);
      const dup1 = createDevolucaoItem(emprestimo, 0, 100, 2);
      const dup2 = createDevolucaoItem(emprestimo, 0, 100, 3);
      const dup3 = createDevolucaoItem(emprestimo, 0, 100, 1);

      emprestimo.emprestimoDevolucaoItem = [original, dup1, dup2, dup3];
      component.itensPendentes.set([original, dup1, dup2, dup3]);

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: 4 + 2 + 3 + 1 = 10
      expect(original.qtde).toBe(10);
      expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(1);
    });
  });
});

describe('EmprestimoDevolucaoComponent - verificaOptionsEnabled', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {

    ({component, emprestimo} = createComponentWithEmprestimo());
  });



  it('deve permitir duplicar quando há apenas 1 item do tipo', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);
    emprestimo.emprestimoDevolucaoItem = [item];

    const result = component.verificaOptionsEnabled(item);

    expect(result.canDuplicate).toBe(true);
    expect(result.canRemoveDuplicates).toBe(false);
  });

  it('deve permitir remover duplicatas quando há 2+ itens do mesmo tipo', () => {
    const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
    const item2 = createDevolucaoItem(emprestimo, 0, 100, 3);
    emprestimo.emprestimoDevolucaoItem = [item1, item2];

    const result = component.verificaOptionsEnabled(item1);

    expect(result.canDuplicate).toBe(false);
    expect(result.canRemoveDuplicates).toBe(true);
  });

  it('deve usar early exit quando detecta 2+ itens', () => {
    // Arrange: 5 itens do mesmo tipo (deve parar ao detectar o 2º)
    const items = Array.from({length: 5}, (_, i) =>
      createDevolucaoItem(emprestimo, i, 100, 5)
    );
    emprestimo.emprestimoDevolucaoItem = items;

    const result = component.verificaOptionsEnabled(items[0]);

    expect(result.canRemoveDuplicates).toBe(true);
  });

  it('deve retornar false para ambas opções quando emprestimo é null', () => {
    component.emprestimo.set(null);
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);

    const result = component.verificaOptionsEnabled(item);

    expect(result.canDuplicate).toBe(false);
    expect(result.canRemoveDuplicates).toBe(false);
  });

  it('deve contar apenas itens com mesmo item.id', () => {
    const item100 = createDevolucaoItem(emprestimo, 1, 100, 5);
    const item200 = createDevolucaoItem(emprestimo, 2, 200, 3);
    const item300 = createDevolucaoItem(emprestimo, 3, 300, 7);
    emprestimo.emprestimoDevolucaoItem = [item100, item200, item300];

    const result = component.verificaOptionsEnabled(item100);

    expect(result.canDuplicate).toBe(true);
    expect(result.canRemoveDuplicates).toBe(false);
  });
});

describe('EmprestimoDevolucaoComponent - duplicarItem', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {

    ({component, emprestimo} = createComponentWithEmprestimo());
  });



  it('deve criar duplicata com quantidade especificada', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itensPendentes.set([original]);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 3;

    component.duplicarItem();

    expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(2);
    const duplicata = emprestimo.emprestimoDevolucaoItem[1];
    expect(duplicata.qtde).toBe(3);
    expect(duplicata.id).toBe(0);
  });

  it('deve reduzir quantidade do item original', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itensPendentes.set([original]);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 4;

    component.duplicarItem();

    expect(original.qtde).toBe(6); // 10 - 4 = 6
  });

  it('deve adicionar duplicata à lista de pendentes', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itensPendentes.set([original]);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 5;

    component.duplicarItem();

    expect(component.itensPendentes()).toHaveLength(2);
    expect(component.itensPendentes()[1].qtde).toBe(5);
  });

  it('deve resetar estado do dialog após duplicação', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itensPendentes.set([original]);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 2;
    component.dialogDuplicaItem = true;

    component.duplicarItem();

    expect(component.qtdeItemDuplicado).toBeUndefined();
    expect(component.dialogDuplicaItem).toBe(false);
  });

  it('deve retornar early se emprestimo é null', () => {
    component.emprestimo.set(null);
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 3;

    component.duplicarItem();

    expect(component.itensPendentes()).toHaveLength(0);
  });

  it('deve retornar early se itemIsEditing é null', () => {
    emprestimo.emprestimoDevolucaoItem = [];
    component.itemIsEditing.set(null);
    component.qtdeItemDuplicado = 3;

    component.duplicarItem();

    expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(0);
  });

  it('deve retornar early se botão save está disabled', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = undefined; // Isso torna disableBtnSaveDuplicar() = true

    const initialLength = emprestimo.emprestimoDevolucaoItem.length;
    component.duplicarItem();

    expect(emprestimo.emprestimoDevolucaoItem).toHaveLength(initialLength);
  });

  it('deve criar structuredClone do item original', () => {
    const original = createDevolucaoItem(emprestimo, 1, 100, 10);
    original.item.descricao = 'Item Teste';
    emprestimo.emprestimoDevolucaoItem = [original];
    component.itensPendentes.set([original]);
    component.itemIsEditing.set(original);
    component.qtdeItemDuplicado = 3;

    component.duplicarItem();

    const duplicata = emprestimo.emprestimoDevolucaoItem[1];
    expect(duplicata).not.toBe(original);
    expect(duplicata.item.id).toBe(original.item.id);
    expect(duplicata.item.descricao).toBe(original.item.descricao);
  });
});

describe('EmprestimoDevolucaoComponent - disableBtnSaveDuplicar', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {

    ({component, emprestimo} = createComponentWithEmprestimo());
  });



  it('deve desabilitar quando qtdeItemDuplicado é zero', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 0;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado é negativo', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = -1;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado é NaN', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = NaN;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado é undefined', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = undefined;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado é string vazia', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = '' as any;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando itemIsEditing é null', () => {
    component.itemIsEditing.set(null);
    component.qtdeItemDuplicado = 5;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado >= qtde do item', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 10;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve desabilitar quando qtdeItemDuplicado > qtde do item', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 15;

    expect(component.disableBtnSaveDuplicar()).toBe(true);
  });

  it('deve habilitar quando todos os critérios são válidos', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 5;

    expect(component.disableBtnSaveDuplicar()).toBe(false);
  });

  it('deve habilitar com quantidade mínima válida (1)', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 1;

    expect(component.disableBtnSaveDuplicar()).toBe(false);
  });

  it('deve habilitar com quantidade máxima válida (qtde - 1)', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 10);
    component.itemIsEditing.set(item);
    component.qtdeItemDuplicado = 9;

    expect(component.disableBtnSaveDuplicar()).toBe(false);
  });
});

describe('EmprestimoDevolucaoComponent - drop (drag-and-drop)', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {

    ({component, emprestimo} = createComponentWithEmprestimo());
  });



  // Nota: Testes de reordenação dentro da mesma lista (moveItemInArray)
  // requerem mock completo do CDK drag-drop e são melhor testados com testes de integração

  describe('Transferência entre listas diferentes', () => {
    it('deve transferir item de pendentes para devolvidos', () => {
      const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
      const item2 = createDevolucaoItem(emprestimo, 2, 200, 3);
      const item3 = createDevolucaoItem(emprestimo, 3, 300, 7);

      const pendentes = [item1, item2];
      const devolvidos = [item3];

      component.itensPendentes.set(pendentes);
      component.itensDevolvidos.set(devolvidos);

      const event = {
        previousContainer: {data: pendentes},
        container: {data: devolvidos},
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<EmprestimoDevolucaoItem[]>;

      component.drop(event);

      expect(component.itensPendentes()).toEqual([item2]);
      expect(component.itensDevolvidos()).toEqual([item3, item1]);
    });

    it('deve transferir item de devolvidos para saída', () => {
      const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
      const item2 = createDevolucaoItem(emprestimo, 2, 200, 3);

      const devolvidos = [item1];
      const saida = [item2];

      component.itensDevolvidos.set(devolvidos);
      component.itensSaida.set(saida);

      const event = {
        previousContainer: {data: devolvidos},
        container: {data: saida},
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<EmprestimoDevolucaoItem[]>;

      component.drop(event);

      expect(component.itensDevolvidos()).toEqual([]);
      expect(component.itensSaida()).toEqual([item1, item2]);
    });

    it('deve transferir item de saída para pendentes', () => {
      const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
      const item2 = createDevolucaoItem(emprestimo, 2, 200, 3);

      const saida = [item1];
      const pendentes = [item2];

      component.itensSaida.set(saida);
      component.itensPendentes.set(pendentes);

      const event = {
        previousContainer: {data: saida},
        container: {data: pendentes},
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<EmprestimoDevolucaoItem[]>;

      component.drop(event);

      expect(component.itensSaida()).toEqual([]);
      expect(component.itensPendentes()).toEqual([item2, item1]);
    });
  });

  describe('Atualização de signals', () => {
    it('deve atualizar ambos signals após transferência entre listas', () => {
      const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
      const item2 = createDevolucaoItem(emprestimo, 2, 200, 3);

      const pendentes = [item1];
      const devolvidos = [item2];

      component.itensPendentes.set(pendentes);
      component.itensDevolvidos.set(devolvidos);

      const event = {
        previousContainer: {data: pendentes},
        container: {data: devolvidos},
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<EmprestimoDevolucaoItem[]>;

      component.drop(event);

      // Ambos signals devem ter novas referências
      expect(component.itensPendentes()).not.toBe(pendentes);
      expect(component.itensDevolvidos()).not.toBe(devolvidos);
    });
  });
});

describe('EmprestimoDevolucaoComponent - onContextMenu', () => {
  let component: EmprestimoDevolucaoComponent;
  let emprestimo: Emprestimo;

  beforeEach(() => {

    ({component, emprestimo} = createComponentWithEmprestimo());
  });



  it('deve prevenir comportamento padrão do navegador', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);
    emprestimo.emprestimoDevolucaoItem = [item];

    const event = {
      preventDefault: jest.fn(),
      clientX: 100,
      clientY: 200
    } as unknown as MouseEvent;

    component.onContextMenu(event, item);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('deve atualizar posição do context menu', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);
    emprestimo.emprestimoDevolucaoItem = [item];

    const event = {
      preventDefault: jest.fn(),
      clientX: 150,
      clientY: 250
    } as unknown as MouseEvent;

    component.onContextMenu(event, item);

    expect(component.contextMenuPosition.x).toBe(150);
    expect(component.contextMenuPosition.y).toBe(250);
  });

  it('deve setar itemIsEditing com o item clicado', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);
    emprestimo.emprestimoDevolucaoItem = [item];

    const event = {
      preventDefault: jest.fn(),
      clientX: 100,
      clientY: 200
    } as unknown as MouseEvent;

    component.onContextMenu(event, item);

    expect(component.itemIsEditing()).toBe(item);
  });

  it('deve criar menu com duplicar habilitado quando há apenas 1 item', () => {
    const item = createDevolucaoItem(emprestimo, 1, 100, 5);
    emprestimo.emprestimoDevolucaoItem = [item];

    const event = {
      preventDefault: jest.fn(),
      clientX: 100,
      clientY: 200
    } as unknown as MouseEvent;

    component.onContextMenu(event, item);

    expect(component.contextMenuItems).toHaveLength(2);
    expect(component.contextMenuItems[0].label).toBe('Duplicar Item');
    expect(component.contextMenuItems[0].disabled).toBe(false);
    expect(component.contextMenuItems[1].label).toBe('Remover Itens Duplicados');
    expect(component.contextMenuItems[1].disabled).toBe(true);
  });

  it('deve criar menu com remover duplicatas habilitado quando há 2+ itens', () => {
    const item1 = createDevolucaoItem(emprestimo, 1, 100, 5);
    const item2 = createDevolucaoItem(emprestimo, 0, 100, 3);
    emprestimo.emprestimoDevolucaoItem = [item1, item2];

    const event = {
      preventDefault: jest.fn(),
      clientX: 100,
      clientY: 200
    } as unknown as MouseEvent;

    component.onContextMenu(event, item1);

    expect(component.contextMenuItems[0].disabled).toBe(true);
    expect(component.contextMenuItems[1].disabled).toBe(false);
  });
});
