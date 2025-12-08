import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MessageService} from 'primeng/api';
import {delay, of, throwError} from 'rxjs';
import {signal} from '@angular/core';

import {RelatorioDashboardComponent} from './relatorio-dashboard.component';
import {RelatorioApiService} from './services/relatorio-api.service';
import {RelatorioDownloadService} from './services/relatorio-download.service';
import {RelatorioParametrosService} from './services/relatorio-parametros.service';
import {LoaderService} from '../framework/loader/loader.service';
import {GerarRelatorioEvent} from './models/relatorio-card.interface';

/**
 * Testes para RelatorioDashboardComponent
 * Cobre Strategy pattern, guarda de operação concorrente e integração com services
 */
describe('RelatorioDashboardComponent', () => {
  let component: RelatorioDashboardComponent;
  let fixture: ComponentFixture<RelatorioDashboardComponent>;
  let mockApiService: jest.Mocked<RelatorioApiService>;
  let mockDownloadService: jest.Mocked<RelatorioDownloadService>;
  let mockParametrosService: jest.Mocked<RelatorioParametrosService>;
  let mockLoaderService: jest.Mocked<LoaderService>;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(async () => {
    mockApiService = {
      gerarHistoricoEmprestimo: jest.fn(),
      gerarItensSemEstoque: jest.fn(),
      gerarEmprestimosRealizados: jest.fn(),
      gerarReservasDoItem: jest.fn(),
      gerarSolicitacoesDoItem: jest.fn(),
      gerarItensQtdeMinima: jest.fn()
    } as any;

    mockDownloadService = {
      downloadBlob: jest.fn(),
      gerarNomeArquivo: jest.fn().mockReturnValue('test-file.pdf'),
      addToHistory: jest.fn(),
      historico: signal([])
    } as any;

    mockParametrosService = {
      salvarParametros: jest.fn()
    } as any;

    mockLoaderService = {
      show: jest.fn(),
      hide: jest.fn()
    } as any;

    mockMessageService = {
      add: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        RelatorioDashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        {provide: RelatorioApiService, useValue: mockApiService},
        {provide: RelatorioDownloadService, useValue: mockDownloadService},
        {provide: RelatorioParametrosService, useValue: mockParametrosService},
        {provide: LoaderService, useValue: mockLoaderService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioDashboardComponent);
    component = fixture.componentInstance;

    // Injeta o mock de MessageService no componente após criação
    (component as unknown as {
      messageService: typeof mockMessageService
    }).messageService = mockMessageService;

    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have relatorios loaded', () => {
      expect(component.relatorios.length).toBeGreaterThan(0);
    });

    it('should start with no report being generated', () => {
      expect(component.relatorioEmGeracao()).toBeUndefined();
    });

    it('should start with modal hidden', () => {
      expect(component.modalVisible()).toBe(false);
    });
  });

  describe('onCardClick', () => {
    it('should open modal with config', () => {
      const config = component.relatorios[0];

      component.onCardClick(config);

      expect(component.modalVisible()).toBe(true);
      expect(component.modalConfig()).toBe(config);
    });
  });

  describe('onGerarRelatorio - Strategy Pattern', () => {
    const mockBlob = new Blob(['test'], {type: 'application/pdf'});

    it('should call correct API method for historico-emprestimo', fakeAsync(() => {
      mockApiService.gerarHistoricoEmprestimo.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'historico-emprestimo',
        formato: 'PDF',
        valores: {documento: '12345678'}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarHistoricoEmprestimo).toHaveBeenCalledWith('12345678', 'PDF');
    }));

    it('should call correct API method for itens-sem-estoque', fakeAsync(() => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'EXCEL',
        valores: {}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarItensSemEstoque).toHaveBeenCalledWith('EXCEL');
    }));

    it('should call correct API method for emprestimos-realizados', fakeAsync(() => {
      mockApiService.gerarEmprestimosRealizados.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'emprestimos-realizados',
        formato: 'PDF',
        valores: {dataInicio: '01/01/2025', dataFim: '31/01/2025'}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarEmprestimosRealizados).toHaveBeenCalledWith('01/01/2025', '31/01/2025', 'PDF');
    }));

    it('should call correct API method for reservas-item', fakeAsync(() => {
      mockApiService.gerarReservasDoItem.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'reservas-item',
        formato: 'PDF',
        valores: {itemId: 123, nomeItem: 'Arduino'}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarReservasDoItem).toHaveBeenCalledWith(123, 'PDF', 'Arduino');
    }));

    it('should call correct API method for solicitacoes-item', fakeAsync(() => {
      mockApiService.gerarSolicitacoesDoItem.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'solicitacoes-item',
        formato: 'EXCEL',
        valores: {itemId: 456, nomeItem: 'Resistor'}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarSolicitacoesDoItem).toHaveBeenCalledWith(456, 'EXCEL', 'Resistor');
    }));

    it('should call correct API method for itens-qtde-minima', fakeAsync(() => {
      mockApiService.gerarItensQtdeMinima.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-qtde-minima',
        formato: 'PDF',
        valores: {}
      };

      component.onGerarRelatorio(event);
      tick();

      expect(mockApiService.gerarItensQtdeMinima).toHaveBeenCalledWith('PDF');
    }));

    it('should handle unknown report id', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'unknown-report',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Erro ao gerar relatório'
        })
      );
    });
  });

  describe('onGerarRelatorio - Concurrent Operation Guard', () => {
    const mockBlob = new Blob(['test']);

    it('should prevent concurrent operations', () => {
      // Cria um Observable que demora para completar
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        of(mockBlob).pipe(delay(1000))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      // Primeira chamada (não aguardamos)
      component.onGerarRelatorio(event);

      // Segunda chamada imediata (deve ser bloqueada pelo guard)
      component.onGerarRelatorio(event);

      // API só deve ter sido chamada uma vez
      expect(mockApiService.gerarItensSemEstoque).toHaveBeenCalledTimes(1);
    });

    it('should allow new operation after previous completes', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(of(mockBlob));

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      // Primeira chamada
      await component.onGerarRelatorio(event);

      // Segunda chamada (deve ser permitida)
      await component.onGerarRelatorio(event);

      expect(mockApiService.gerarItensSemEstoque).toHaveBeenCalledTimes(2);
    });

    it('should set relatorioEmGeracao during operation', () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        of(mockBlob).pipe(delay(100))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      // Inicia a operação (não aguardamos)
      component.onGerarRelatorio(event);

      // Durante a operação, deve estar setado
      expect(component.relatorioEmGeracao()).toBe('itens-sem-estoque');
    });
  });

  describe('onGerarRelatorio - Success flow', () => {
    const mockBlob = new Blob(['test']);

    beforeEach(() => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(of(mockBlob));
    });

    it('should show loader during operation', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockLoaderService.show).toHaveBeenCalled();
      expect(mockLoaderService.hide).toHaveBeenCalled();
    });

    it('should close modal when generation starts', async () => {
      component.modalVisible.set(true);

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(component.modalVisible()).toBe(false);
    });

    it('should download blob on success', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockDownloadService.downloadBlob).toHaveBeenCalledWith(mockBlob, 'test-file.pdf');
    });

    it('should add to history on success', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockDownloadService.addToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          relatorioId: 'itens-sem-estoque',
          formato: 'PDF'
        })
      );
    });

    it('should show success message', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Relatório gerado!'
        })
      );
    });

    it('should save parameters when provided', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'historico-emprestimo',
        formato: 'PDF',
        valores: {documento: '12345678'}
      };

      mockApiService.gerarHistoricoEmprestimo.mockReturnValue(of(mockBlob));

      await component.onGerarRelatorio(event);

      expect(mockParametrosService.salvarParametros).toHaveBeenCalledWith(
        'historico-emprestimo',
        {documento: '12345678'}
      );
    });

    it('should not save parameters when empty', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockParametrosService.salvarParametros).not.toHaveBeenCalled();
    });
  });

  describe('onGerarRelatorio - Type Guard Validation', () => {
    it('should fail when documento is missing for historico-emprestimo', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'historico-emprestimo',
        formato: 'PDF',
        valores: {} // documento ausente
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Documento é obrigatório')
        })
      );
    });

    it('should fail when documento is empty string', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'historico-emprestimo',
        formato: 'PDF',
        valores: {documento: '   '} // apenas espaços
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error'
        })
      );
    });

    it('should fail when dataInicio is missing for emprestimos-realizados', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'emprestimos-realizados',
        formato: 'PDF',
        valores: {dataFim: '31/01/2025'} // dataInicio ausente
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('Data de início e fim são obrigatórias')
        })
      );
    });

    it('should fail when itemId is not a number for reservas-item', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'reservas-item',
        formato: 'PDF',
        valores: {itemId: 'abc', nomeItem: 'Test'} // itemId não é número
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: expect.stringContaining('ID do item é obrigatório')
        })
      );
    });

    it('should fail when itemId is negative', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'solicitacoes-item',
        formato: 'PDF',
        valores: {itemId: -1, nomeItem: 'Test'}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error'
        })
      );
    });

    it('should fail when relatorioId has invalid format', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: '__proto__', // Tentativa de prototype pollution
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'ID de relatório inválido.'
        })
      );
    });

    it('should fail when relatorioId contains special characters', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: 'relatorio<script>',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'ID de relatório inválido.'
        })
      );
    });

    it('should fail when relatorioId starts with hyphen', async () => {
      const event: GerarRelatorioEvent = {
        relatorioId: '-invalid-id',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error'
        })
      );
    });
  });

  describe('onGerarRelatorio - Error handling', () => {
    it('should show error message on API failure', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 500}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Erro ao gerar relatório'
        })
      );
    });

    it('should hide loader on error', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 500}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockLoaderService.hide).toHaveBeenCalled();
    });

    it('should reset relatorioEmGeracao on error', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 500}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(component.relatorioEmGeracao()).toBeUndefined();
    });

    it('should show specific message for 400 error', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 400}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Parâmetros inválidos. Verifique os dados informados.'
        })
      );
    });

    it('should show specific message for 403 error', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 403}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Você não tem permissão para gerar este relatório.'
        })
      );
    });

    it('should show specific message for 404 error', async () => {
      mockApiService.gerarItensSemEstoque.mockReturnValue(
        throwError(() => ({status: 404}))
      );

      const event: GerarRelatorioEvent = {
        relatorioId: 'itens-sem-estoque',
        formato: 'PDF',
        valores: {}
      };

      await component.onGerarRelatorio(event);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Nenhum registro encontrado para os filtros informados.'
        })
      );
    });
  });
});
