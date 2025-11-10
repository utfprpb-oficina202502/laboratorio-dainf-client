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

  beforeEach(async () => {
    const serviceMock = {
      solicitar: jest.fn(),
      findAll: jest.fn().mockReturnValue(of([])),
      findAllPaged: jest.fn().mockReturnValue(of([])),
      verificarPendencias: jest.fn(),
      invalidar: jest.fn()
    };
    await TestBed.configureTestingModule({
      providers: [
        { provide: NadaConstaService, useValue: serviceMock },
        { provide: MessageService, useValue: {} },
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
    expect(component.getAcaoSucesso()).toBe('Pendências verificadas com sucesso.');
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
    expect(component.getAcaoErro()).toBe('Erro ao verificar');
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
    expect(component.getAcaoSucesso()).toBe('Nada Consta invalidado com sucesso.');
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
    expect(component.getAcaoErro()).toBe('Erro ao invalidar');
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

  it('deve controlar sinais de loading e feedback', () => {
    component.setVerificandoPendencias(10);
    expect(component.getVerificandoPendencias()).toBe(10);
    component.setInvalidando(20);
    expect(component.getInvalidando()).toBe(20);
    component.setAcaoErro('erro');
    expect(component.getAcaoErro()).toBe('erro');
    component.setAcaoSucesso('sucesso');
    expect(component.getAcaoSucesso()).toBe('sucesso');
  });
});
