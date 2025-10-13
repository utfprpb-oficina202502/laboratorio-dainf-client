import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {ConfirmationService, MessageService} from 'primeng/api';
import {EmprestimoDevolucaoComponent} from './emprestimo.devolucao.component';
import {EmprestimoService} from './emprestimo.service';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import {Emprestimo} from './emprestimo';
import {Item} from '../item/item';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';

describe('EmprestimoDevolucaoComponent - removeItensDuplicadosByItem', () => {
  let component: EmprestimoDevolucaoComponent;
  let cdrSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, EmprestimoDevolucaoComponent],
      providers: [
        MessageService,
        ConfirmationService,
        {provide: EmprestimoService, useValue: {}},
        {provide: LoaderService, useValue: {}},
        {provide: LoginService, useValue: {}},
        {provide: LoggerService, useValue: {}},
      ],
    });

    const fixture = TestBed.createComponent(EmprestimoDevolucaoComponent);
    component = fixture.componentInstance;

    // Mock do ChangeDetectorRef
    cdrSpy = jest.spyOn(component['cdr'], 'markForCheck');

    // Inicializa objeto de empréstimo vazio
    component.object = {
      emprestimoDevolucaoItem: []
    } as unknown as Emprestimo;
  });

  // Helper para criar item de teste
  const createItem = (itemId: number, itemDesc: string): Item => ({
    id: itemId,
    descricao: itemDesc
  } as Item);

  // Helper para criar item de devolução
  const createDevolucaoItem = (
    id: number | null,
    itemId: number,
    qtde: number,
    status: StatusDevolucao = StatusDevolucao.P
  ): EmprestimoDevolucaoItem => ({
    id: id,
    qtde: qtde,
    statusDevolucao: status,
    item: createItem(itemId, `Item ${itemId}`),
    emprestimo: component.object
  } as EmprestimoDevolucaoItem);

  describe('Consolidação de quantidades', () => {
    it('deve consolidar quantidades de todas as duplicatas em todas as listas', () => {
      // Arrange: Item original + 2 duplicatas espalhadas nas listas
      const itemOriginal = createDevolucaoItem(1, 100, 5, StatusDevolucao.P);
      const duplicata1 = createDevolucaoItem(0, 100, 2, StatusDevolucao.D);
      const duplicata2 = createDevolucaoItem(null, 100, 3, StatusDevolucao.S);

      component.object.emprestimoDevolucaoItem = [itemOriginal, duplicata1, duplicata2];
      component.itensPendentes = [itemOriginal];
      component.itensDevolvidos = [duplicata1];
      component.itensSaida = [duplicata2];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Quantidade total = 5 + 2 + 3 = 10
      expect(itemOriginal.qtde).toBe(10);
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(component.object.emprestimoDevolucaoItem[0]).toBe(itemOriginal);
    });

    it('deve consolidar quantidades quando há múltiplas duplicatas na mesma coluna', () => {
      // Arrange: 1 original + 3 duplicatas todas pendentes
      const itemOriginal = createDevolucaoItem(1, 100, 10);
      const dup1 = createDevolucaoItem(0, 100, 2);
      const dup2 = createDevolucaoItem(0, 100, 3);
      const dup3 = createDevolucaoItem(null, 100, 5);

      component.object.emprestimoDevolucaoItem = [itemOriginal, dup1, dup2, dup3];
      component.itensPendentes = [itemOriginal, dup1, dup2, dup3];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: 10 + 2 + 3 + 5 = 20
      expect(itemOriginal.qtde).toBe(20);
      expect(component.itensPendentes).toHaveLength(1);
      expect(component.itensPendentes[0]).toBe(itemOriginal);
    });
  });

  describe('Seleção de item canônico', () => {
    it('deve manter item canônico (id > 0) quando presente', () => {
      // Arrange: Item original com id válido + duplicatas
      const itemOriginal = createDevolucaoItem(5, 100, 7);
      const duplicata1 = createDevolucaoItem(0, 100, 3);
      const duplicata2 = createDevolucaoItem(null, 100, 2);

      component.object.emprestimoDevolucaoItem = [duplicata1, itemOriginal, duplicata2];
      component.itensPendentes = [duplicata1, itemOriginal, duplicata2];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Item canônico (id=5) deve ser mantido
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(component.object.emprestimoDevolucaoItem[0].id).toBe(5);
      expect(component.object.emprestimoDevolucaoItem[0].qtde).toBe(12); // 7 + 3 + 2
    });

    it('deve usar primeira duplicata como canônico quando não há item original', () => {
      // Arrange: Apenas duplicatas (todos com id = 0 ou null)
      const dup1 = createDevolucaoItem(0, 100, 4);
      const dup2 = createDevolucaoItem(0, 100, 3);
      const dup3 = createDevolucaoItem(null, 100, 2);

      component.object.emprestimoDevolucaoItem = [dup1, dup2, dup3];
      component.itensPendentes = [dup1, dup2, dup3];

      // Act
      component.removeItensDuplicadosByItem(dup1);

      // Assert: Primeira duplicata (dup1) deve ser mantida como canônica
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(component.object.emprestimoDevolucaoItem[0]).toBe(dup1);
      expect(dup1.qtde).toBe(9); // 4 + 3 + 2
    });
  });

  describe('Remoção de duplicatas de todas as listas', () => {
    it('deve remover duplicatas das 4 listas do Kanban', () => {
      // Arrange: Duplicatas espalhadas por todas as listas
      const itemOriginal = createDevolucaoItem(1, 100, 5, StatusDevolucao.P);
      const dup1 = createDevolucaoItem(0, 100, 2, StatusDevolucao.P);
      const dup2 = createDevolucaoItem(0, 100, 3, StatusDevolucao.D);
      const dup3 = createDevolucaoItem(null, 100, 4, StatusDevolucao.S);

      component.object.emprestimoDevolucaoItem = [itemOriginal, dup1, dup2, dup3];
      component.itensPendentes = [itemOriginal, dup1];
      component.itensDevolvidos = [dup2];
      component.itensSaida = [dup3];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Todas as listas devem conter apenas o item original
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(component.object.emprestimoDevolucaoItem[0]).toBe(itemOriginal);

      expect(component.itensPendentes).toHaveLength(1);
      expect(component.itensPendentes[0]).toBe(itemOriginal);

      expect(component.itensDevolvidos).toHaveLength(0);
      expect(component.itensSaida).toHaveLength(0);
    });

    it('deve remover apenas duplicatas do item específico, mantendo outros itens', () => {
      // Arrange: Duplicatas do item 100 + item 200 diferente
      const item100Original = createDevolucaoItem(1, 100, 5);
      const item100Dup = createDevolucaoItem(0, 100, 3);
      const item200 = createDevolucaoItem(2, 200, 7);

      component.object.emprestimoDevolucaoItem = [item100Original, item100Dup, item200];
      component.itensPendentes = [item100Original, item100Dup, item200];

      // Act
      component.removeItensDuplicadosByItem(item100Original);

      // Assert: Item 200 deve ser mantido intacto
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(2);
      expect(component.object.emprestimoDevolucaoItem).toContain(item100Original);
      expect(component.object.emprestimoDevolucaoItem).toContain(item200);
      expect(component.object.emprestimoDevolucaoItem).not.toContain(item100Dup);

      expect(item200.qtde).toBe(7); // Quantidade do item 200 inalterada
    });
  });

  describe('Tratamento de casos especiais', () => {
    it('deve retornar early quando não há duplicatas', () => {
      // Arrange: Apenas item original sem duplicatas
      const itemOriginal = createDevolucaoItem(1, 100, 5);

      component.object.emprestimoDevolucaoItem = [itemOriginal];
      component.itensPendentes = [itemOriginal];

      const qtdeOriginal = itemOriginal.qtde;

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert: Nada deve mudar
      expect(itemOriginal.qtde).toBe(qtdeOriginal);
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(cdrSpy).not.toHaveBeenCalled();
    });

    it('deve lidar com lista vazia', () => {
      // Arrange: Listas vazias
      const itemTest = createDevolucaoItem(1, 100, 5);

      // Act
      component.removeItensDuplicadosByItem(itemTest);

      // Assert: Não deve gerar erro
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(0);
      expect(cdrSpy).not.toHaveBeenCalled();
    });

    it('deve lidar com único item duplicado', () => {
      // Arrange: Apenas uma duplicata, sem original
      const duplicata = createDevolucaoItem(0, 100, 5);

      component.object.emprestimoDevolucaoItem = [duplicata];
      component.itensPendentes = [duplicata];

      // Act
      component.removeItensDuplicadosByItem(duplicata);

      // Assert: Duplicata deve se tornar canônica e permanecer
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
      expect(component.object.emprestimoDevolucaoItem[0]).toBe(duplicata);
      expect(duplicata.qtde).toBe(5);
    });

    it('deve lidar com duplicatas spread entre múltiplas colunas Kanban', () => {
      // Arrange: Simula drag-drop - duplicatas em colunas diferentes
      const original = createDevolucaoItem(1, 100, 10, StatusDevolucao.P);
      const dupPendente = createDevolucaoItem(0, 100, 5, StatusDevolucao.P);
      const dupDevolvido = createDevolucaoItem(0, 100, 3, StatusDevolucao.D);
      const dupSaida = createDevolucaoItem(null, 100, 2, StatusDevolucao.S);

      component.object.emprestimoDevolucaoItem = [original, dupPendente, dupDevolvido, dupSaida];
      component.itensPendentes = [original, dupPendente];
      component.itensDevolvidos = [dupDevolvido];
      component.itensSaida = [dupSaida];

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: Original consolidado, outras colunas limpas
      expect(original.qtde).toBe(20); // 10 + 5 + 3 + 2
      expect(component.itensPendentes).toEqual([original]);
      expect(component.itensDevolvidos).toEqual([]);
      expect(component.itensSaida).toEqual([]);
    });
  });

  describe('Verificação de change detection', () => {
    it('deve chamar markForCheck() após remover duplicatas', () => {
      // Arrange
      const itemOriginal = createDevolucaoItem(1, 100, 5);
      const duplicata = createDevolucaoItem(0, 100, 3);

      component.object.emprestimoDevolucaoItem = [itemOriginal, duplicata];
      component.itensPendentes = [itemOriginal, duplicata];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert
      expect(cdrSpy).toHaveBeenCalledTimes(1);
    });

    it('não deve chamar markForCheck() quando não há duplicatas', () => {
      // Arrange
      const itemOriginal = createDevolucaoItem(1, 100, 5);

      component.object.emprestimoDevolucaoItem = [itemOriginal];
      component.itensPendentes = [itemOriginal];

      // Act
      component.removeItensDuplicadosByItem(itemOriginal);

      // Assert
      expect(cdrSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integridade de dados', () => {
    it('deve manter referências corretas após remoção', () => {
      // Arrange
      const original = createDevolucaoItem(1, 100, 5);
      const dup1 = createDevolucaoItem(0, 100, 2);
      const dup2 = createDevolucaoItem(0, 100, 3);

      component.object.emprestimoDevolucaoItem = [original, dup1, dup2];
      component.itensPendentes = [original, dup1, dup2];

      // Captura referência antes da remoção
      const originalRef = original;

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: Mesma referência do objeto deve ser mantida
      expect(component.object.emprestimoDevolucaoItem[0]).toBe(originalRef);
      expect(component.itensPendentes[0]).toBe(originalRef);
    });

    it('deve somar quantidades corretamente com valores decimais', () => {
      // Arrange: Quantidades com decimais
      const original = createDevolucaoItem(1, 100, 5.5);
      const dup1 = createDevolucaoItem(0, 100, 2.3);
      const dup2 = createDevolucaoItem(0, 100, 1.2);

      component.object.emprestimoDevolucaoItem = [original, dup1, dup2];
      component.itensPendentes = [original, dup1, dup2];

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: 5.5 + 2.3 + 1.2 = 9.0
      expect(original.qtde).toBe(9.0);
    });

    it('deve preservar outras propriedades do item canônico', () => {
      // Arrange
      const original = createDevolucaoItem(1, 100, 5, StatusDevolucao.D);
      const dup = createDevolucaoItem(0, 100, 3, StatusDevolucao.P);

      component.object.emprestimoDevolucaoItem = [original, dup];
      component.itensPendentes = [dup];
      component.itensDevolvidos = [original];

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
      // 1. Item original criado (id=1, qtde=10)
      const original = createDevolucaoItem(1, 100, 10, StatusDevolucao.P);

      // 2. Usuário duplica item (id=0, qtde=5)
      const duplicata = createDevolucaoItem(0, 100, 5, StatusDevolucao.P);

      // 3. Usuário ajusta quantidade original para 5 (10 - 5)
      original.qtde = 5;

      // 4. Usuário arrasta duplicata para "Devolvidos"
      duplicata.statusDevolucao = StatusDevolucao.D;

      component.object.emprestimoDevolucaoItem = [original, duplicata];
      component.itensPendentes = [original];
      component.itensDevolvidos = [duplicata];

      // Act: Usuário remove duplicatas
      component.removeItensDuplicadosByItem(original);

      // Assert: Quantidade total restaurada no original
      expect(original.qtde).toBe(10); // 5 + 5 = 10
      expect(component.itensPendentes).toEqual([original]);
      expect(component.itensDevolvidos).toEqual([]);
    });

    it('deve lidar com múltiplas duplicações sucessivas', () => {
      // Arrange: Usuário duplicou 3 vezes do mesmo item
      const original = createDevolucaoItem(1, 100, 4);
      const dup1 = createDevolucaoItem(0, 100, 2);
      const dup2 = createDevolucaoItem(0, 100, 3);
      const dup3 = createDevolucaoItem(0, 100, 1);

      component.object.emprestimoDevolucaoItem = [original, dup1, dup2, dup3];
      component.itensPendentes = [original, dup1, dup2, dup3];

      // Act
      component.removeItensDuplicadosByItem(original);

      // Assert: 4 + 2 + 3 + 1 = 10
      expect(original.qtde).toBe(10);
      expect(component.object.emprestimoDevolucaoItem).toHaveLength(1);
    });
  });
});
