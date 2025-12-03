import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {NadaConstaListComponent} from './nada-consta-list.component';
import {NadaConstaService} from '../nada-consta.service';
import {of, throwError} from 'rxjs';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { LoaderService} from "../../framework/loader/loader.service";
import {LoginService} from "../../login/login.service";

describe('NadaConstaListComponent', () => {
  let fixture: any;
  let component: NadaConstaListComponent;
  let service: NadaConstaService;

  let messageService: MessageService;

  beforeEach(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const serviceMock = {
      solicitar: jest.fn(),
      findAll: jest.fn().mockReturnValue(of([])),
      findAllPaged: jest.fn().mockReturnValue(of([])),
      verificarPendencias: jest.fn(),
      invalidar: jest.fn(),
      downloadPdf: jest.fn(),
      reenviarEmail: jest.fn()
    };
    const messageServiceMock = {
      add: jest.fn()
    };
    await TestBed.configureTestingModule({
      providers: [
        { provide: NadaConstaService, useValue: serviceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ConfirmationService, useValue: {} },
        { provide: LoaderService, useValue: {} },
        { provide: LoginService, useValue: {} },
        { provide: Router, useValue: {} }
      ],
      imports: [NadaConstaListComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(NadaConstaListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NadaConstaService);
    messageService = TestBed.inject(MessageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve abrir e fechar modal de adicionar', () => {
    component.adicionar();
    expect(component.getShowAdicionarModal()).toBe(true);
    component.cancelarAdicionar();
    expect(component.getShowAdicionarModal()).toBe(false);
    expect(component.getRegistroAcademico()).toBe('');
    expect(component.getSolicitando()).toBe(false);
    expect(component.getSolicitacaoErro()).toBeNull();
    expect(component.getSolicitacaoSucesso()).toBe(false);
  });

  it('deve solicitar Nada Consta com sucesso', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.solicitar as jest.Mock).mockReturnValueOnce(of({ sucesso: true }));
    const findAllSpy = jest.spyOn(component, 'findAll');
    component.setRegistroAcademico('12345678900');
    component.continuarAdicionar();
    tick();
    expect(component.getSolicitacaoSucesso()).toBe(true);
    expect(component.getShowAdicionarModal()).toBe(false);
    expect(component.getRegistroAcademico()).toBe('');
    expect(findAllSpy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  }));

  it('deve tratar erro ao solicitar Nada Consta', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.solicitar as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Erro ao solicitar' } })));
    component.setRegistroAcademico('12345678900');
    component.continuarAdicionar();
    tick();
    expect(component.getSolicitacaoErro()).toBe('Erro ao solicitar');
    expect(component.getSolicitacaoSucesso()).toBe(false);
    expect(spy).toHaveBeenCalled();
  }));

  it('deve aplicar e limpar filtro global', () => {
    const applyFilterSpy = jest.spyOn(component, 'applyFilter');
    component.onGlobalFilter('teste');
    expect(component.filterValue).toBe('teste');
    expect(applyFilterSpy).toHaveBeenCalledWith('teste');
    component.clearGlobalFilter();
    expect(component.filterValue).toBe('');
    expect(applyFilterSpy).toHaveBeenCalledWith('');
  });

  it('deve formatar data corretamente', () => {
    const dateStr = '2025-10-21T14:30:00Z';
    expect(component.formatDateTime(dateStr)).toContain('21/10/2025');
  });

  it('deve retornar label e severidade de status', () => {
    expect(component.getStatusLabel('PENDENTE')).toBe('COM PENDÊNCIA');
    expect(component.getStatusLabel('COMPLETED')).toBe('EMITIDO');
    expect(component.getStatusLabel('FAILED')).toBe('FALHA');
    expect(component.getStatusLabel('OUTRO')).toBe('OUTRO');
    expect(component.getStatusSeverity('PENDENTE')).toBe('warn');
    expect(component.getStatusSeverity('COMPLETED')).toBe('success');
    expect(component.getStatusSeverity('FAILED')).toBe('danger');
    expect(component.getStatusSeverity('OUTRO')).toBe('warn');
  });

  it('deve chamar métodos de ação sem erro', () => {
    const element = { id: 1 } as any;
    expect(() => component.reenviarNadaConsta(element)).not.toThrow();
    expect(() => component.atualizarStatus(element)).not.toThrow();
  });

  it('deve verificar pendências com sucesso', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.verificarPendencias as jest.Mock) = jest.fn().mockReturnValueOnce(of({ id: 1 }));
    const findAllSpy = jest.spyOn(component, 'findAll');
    const row = { id: 1 } as any;
    component.verificarPendencias(row);
    tick();
    expect(component.getVerificandoPendencias()).toBeNull();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Pendências verificadas com sucesso.'
    });
    expect(findAllSpy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  }));

  it('deve tratar erro ao verificar pendências', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.verificarPendencias as jest.Mock) = jest.fn().mockReturnValueOnce(throwError(() => ({ error: { message: 'Erro ao verificar' } })));
    const row = { id: 2 } as any;
    component.verificarPendencias(row);
    tick();
    expect(component.getVerificandoPendencias()).toBeNull();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao verificar'
    });
    expect(spy).toHaveBeenCalled();
  }));

  it('deve invalidar Nada Consta com sucesso', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.invalidar as jest.Mock) = jest.fn().mockReturnValueOnce(of({ id: 3 }));
    const findAllSpy = jest.spyOn(component, 'findAll');
    const row = { id: 3 } as any;
    component.invalidar(row);
    tick();
    expect(component.getInvalidando()).toBeNull();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Nada Consta invalidado com sucesso.'
    });
    expect(findAllSpy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  }));

  it('deve tratar erro ao invalidar Nada Consta', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.invalidar as jest.Mock) = jest.fn().mockReturnValueOnce(throwError(() => ({ error: { message: 'Erro ao invalidar' } })));
    const row = { id: 4 } as any;
    component.invalidar(row);
    tick();
    expect(component.getInvalidando()).toBeNull();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao invalidar'
    });
    expect(spy).toHaveBeenCalled();
  }));

  it('deve abrir e cancelar dialog de confirmação de invalidar', () => {
    const row = { id: 5 } as any;
    component.abrirDialogConfirmarInvalidar(row);
    expect(component.getShowConfirmInvalidar()).toBe(true);
    expect(component.getRegistroParaInvalidar()).toEqual(row);
    component.cancelarInvalidar();
    expect(component.getShowConfirmInvalidar()).toBe(false);
    expect(component.getRegistroParaInvalidar()).toBeNull();
  });

  it('deve confirmar invalidar e fechar dialog', fakeAsync(() => {
    (service.invalidar as jest.Mock) = jest.fn().mockReturnValueOnce(of({ id: 6 }));
    const spy = jest.spyOn(component, 'invalidar');
    const row = { id: 6 } as any;
    component.abrirDialogConfirmarInvalidar(row);
    component.confirmarInvalidar();
    tick();
    expect(spy).toHaveBeenCalledWith(row);
    expect(component.getShowConfirmInvalidar()).toBe(false);
    expect(component.getRegistroParaInvalidar()).toBeNull();
  }));

  it('deve exibir botão de invalidar apenas para status EMITIDO', () => {
    const getStatusLabel = component.getStatusLabel;
    expect(getStatusLabel('COMPLETED')).toBe('EMITIDO');
    expect(getStatusLabel('INVALIDADO')).toBe('INVALIDADO');
    // Simula lógica do template
    const showInvalidar = getStatusLabel('COMPLETED') === 'EMITIDO';
    const hideInvalidar = getStatusLabel('INVALIDADO') === 'EMITIDO';
    expect(showInvalidar).toBe(true);
    expect(hideInvalidar).toBe(false);
  });

  it('deve controlar sinais de loading', () => {
    component.setVerificandoPendencias(10);
    expect(component.getVerificandoPendencias()).toBe(10);
    component.setInvalidando(20);
    expect(component.getInvalidando()).toBe(20);
  });

  describe('imprimirNadaConsta', () => {
    it('deve baixar e abrir PDF com sucesso', fakeAsync(() => {
      const mockArrayBuffer = new ArrayBuffer(8);
      (service.downloadPdf as jest.Mock).mockReturnValue(of(mockArrayBuffer));

      // Mock globalThis.URL methods
      const mockBlobUrl = 'blob:mock-url';
      const urlCreateSpy = jest.fn().mockReturnValue(mockBlobUrl);
      const urlRevokeSpy = jest.fn();
      Object.defineProperty(globalThis.URL, 'createObjectURL', {
        value: urlCreateSpy,
        writable: true,
        configurable: true
      });
      Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
        value: urlRevokeSpy,
        writable: true,
        configurable: true
      });

      const globalOpenSpy = jest.spyOn(globalThis, 'open').mockImplementation(() => null);

      // Mock do actionsMenu
      const actionsMenuMock = { hide: jest.fn(), toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: () => actionsMenuMock,
        writable: true
      });

      const row = { id: 11 } as any;
      component.imprimirNadaConsta(row);
      tick();

      expect(actionsMenuMock.hide).toHaveBeenCalled();
      expect(service.downloadPdf).toHaveBeenCalledWith(11);
      expect(urlCreateSpy).toHaveBeenCalled();
      expect(globalOpenSpy).toHaveBeenCalledWith(mockBlobUrl, '_blank');
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'PDF Gerado',
        detail: 'O PDF foi aberto em uma nova aba.'
      });

      tick(100);
      expect(urlRevokeSpy).toHaveBeenCalledWith(mockBlobUrl);

      globalOpenSpy.mockRestore();
    }));

    it('deve tratar erro ao baixar PDF', fakeAsync(() => {
      (service.downloadPdf as jest.Mock).mockReturnValue(throwError(() => ({ error: { message: 'Erro ao gerar PDF' } })));

      const actionsMenuMock = { hide: jest.fn(), toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: () => actionsMenuMock,
        writable: true
      });

      const row = { id: 12 } as any;
      component.imprimirNadaConsta(row);
      tick();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao gerar PDF'
      });
    }));
  });

  describe('reenviarEmailNadaConsta', () => {
    it('deve reenviar email com sucesso', fakeAsync(() => {
      (service.reenviarEmail as jest.Mock).mockReturnValue(of({}));

      const actionsMenuMock = { hide: jest.fn(), toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: () => actionsMenuMock,
        writable: true
      });

      const row = { id: 13 } as any;
      component.reenviarEmailNadaConsta(row);
      tick();

      expect(actionsMenuMock.hide).toHaveBeenCalled();
      expect(service.reenviarEmail).toHaveBeenCalledWith(13);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Email Enviado',
        detail: '2ª via do Nada Consta enviada com sucesso.'
      });
    }));

    it('deve tratar erro ao reenviar email', fakeAsync(() => {
      (service.reenviarEmail as jest.Mock).mockReturnValue(throwError(() => ({ error: { message: 'Erro ao enviar email' } })));

      const actionsMenuMock = { hide: jest.fn(), toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: () => actionsMenuMock,
        writable: true
      });

      const row = { id: 14 } as any;
      component.reenviarEmailNadaConsta(row);
      tick();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao enviar email'
      });
    }));
  });

  describe('openOptions - Menu por Status', () => {
    let actionsMenuMock: any;

    beforeEach(() => {
      actionsMenuMock = { hide: jest.fn(), toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: () => actionsMenuMock,
        writable: true
      });
    });

    it('deve abrir menu com opções completas para status COMPLETED', () => {
      component.objects = [
        { id: 15, status: 'COMPLETED', usuario: { nome: 'João' } } as any
      ];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 15);

      expect(component.contextMenuItems).toHaveLength(4);
      expect(component.contextMenuItems[0].label).toBe('Imprimir');
      expect(component.contextMenuItems[1].label).toBe('2ª via email');
      expect(component.contextMenuItems[2].label).toBe('Invalidar');
      expect(component.contextMenuItems[3].label).toBe('Cancelar');
      expect(actionsMenuMock.toggle).toHaveBeenCalledWith(mockEvent);
    });

    it('deve abrir menu com opções completas para status CONCLUIDO (variante)', () => {
      component.objects = [
        { id: 16, status: 'CONCLUIDO', usuario: { nome: 'Maria' } } as any
      ];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 16);

      expect(component.contextMenuItems).toHaveLength(4);
      expect(component.contextMenuItems[0].label).toBe('Imprimir');
      expect(actionsMenuMock.toggle).toHaveBeenCalled();
    });

    it('deve abrir menu apenas com Revalidar para status PENDING', () => {
      component.objects = [
        { id: 17, status: 'PENDING', usuario: { nome: 'Pedro' } } as any
      ];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 17);

      expect(component.contextMenuItems).toHaveLength(2);
      expect(component.contextMenuItems[0].label).toBe('Revalidar');
      expect(component.contextMenuItems[1].label).toBe('Cancelar');
      expect(actionsMenuMock.toggle).toHaveBeenCalled();
    });

    it('deve abrir menu apenas com Revalidar para status PENDENTE (variante)', () => {
      component.objects = [
        { id: 18, status: 'PENDENTE', usuario: { nome: 'Ana' } } as any
      ];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 18);

      expect(component.contextMenuItems).toHaveLength(2);
      expect(component.contextMenuItems[0].label).toBe('Revalidar');
      expect(actionsMenuMock.toggle).toHaveBeenCalled();
    });

    it('não deve abrir menu para status INVALIDATED', () => {
      component.objects = [
        { id: 19, status: 'INVALIDATED', usuario: { nome: 'Carlos' } } as any
      ];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 19);

      expect(component.contextMenuItems).toHaveLength(0);
      expect(actionsMenuMock.toggle).not.toHaveBeenCalled();
    });

    it('não deve fazer nada se o registro não for encontrado', () => {
      component.objects = [];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 999);

      expect(component.contextMenuItems).toHaveLength(0);
      expect(actionsMenuMock.toggle).not.toHaveBeenCalled();
    });

    it('deve executar comando Imprimir ao clicar', fakeAsync(() => {
      const row = { id: 20, status: 'COMPLETED', usuario: { nome: 'José' } } as any;
      component.objects = [row];
      const imprimirSpy = jest.spyOn(component, 'imprimirNadaConsta').mockImplementation(() => undefined);

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 20);

      const imprimirItem = component.contextMenuItems.find(item => item.label === 'Imprimir');
      imprimirItem?.command?.({});
      tick();

      expect(imprimirSpy).toHaveBeenCalledWith(row);
    }));

    it('deve executar comando 2ª via email ao clicar', fakeAsync(() => {
      const row = { id: 21, status: 'COMPLETED', usuario: { nome: 'Fernanda' } } as any;
      component.objects = [row];
      const reenviarSpy = jest.spyOn(component, 'reenviarEmailNadaConsta').mockImplementation(() => undefined);

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 21);

      const reenviarItem = component.contextMenuItems.find(item => item.label === '2ª via email');
      reenviarItem?.command?.({});
      tick();

      expect(reenviarSpy).toHaveBeenCalledWith(row);
    }));

    it('deve executar comando Invalidar e fechar menu ao clicar', fakeAsync(() => {
      const row = { id: 22, status: 'COMPLETED', usuario: { nome: 'Lucas' } } as any;
      component.objects = [row];
      const invalidarSpy = jest.spyOn(component, 'abrirDialogConfirmarInvalidar').mockImplementation(() => undefined);

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 22);

      const invalidarItem = component.contextMenuItems.find(item => item.label === 'Invalidar');
      invalidarItem?.command?.({});
      tick();

      expect(actionsMenuMock.hide).toHaveBeenCalled();
      expect(invalidarSpy).toHaveBeenCalledWith(row);
    }));

    it('deve executar comando Revalidar e fechar menu ao clicar', fakeAsync(() => {
      const row = { id: 23, status: 'PENDING', usuario: { nome: 'Mariana' } } as any;
      component.objects = [row];
      const revalidarSpy = jest.spyOn(component, 'verificarPendencias').mockImplementation(() => undefined);

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 23);

      const revalidarItem = component.contextMenuItems.find(item => item.label === 'Revalidar');
      revalidarItem?.command?.({});
      tick();

      expect(actionsMenuMock.hide).toHaveBeenCalled();
      expect(revalidarSpy).toHaveBeenCalledWith(row);
    }));

    it('deve fechar menu ao clicar em Cancelar', () => {
      const row = { id: 24, status: 'COMPLETED', usuario: { nome: 'Rafael' } } as any;
      component.objects = [row];

      const mockEvent = new Event('click');
      component.openOptions(mockEvent, 24);

      const cancelarItem = component.contextMenuItems.find(item => item.label === 'Cancelar');
      cancelarItem?.command?.({});

      expect(actionsMenuMock.hide).toHaveBeenCalled();
    });

    it('deve normalizar status em lowercase para uppercase na comparação', () => {
      component.objects = [
        { id: 25, status: 'completed', usuario: { nome: 'Baixo' } } as any,
        { id: 26, status: 'pending', usuario: { nome: 'Pendente' } } as any
      ];

      const mockEvent1 = new Event('click');
      component.openOptions(mockEvent1, 25);
      expect(component.contextMenuItems[0].label).toBe('Imprimir');

      const mockEvent2 = new Event('click');
      component.openOptions(mockEvent2, 26);
      expect(component.contextMenuItems[0].label).toBe('Revalidar');
    });
  });
});
