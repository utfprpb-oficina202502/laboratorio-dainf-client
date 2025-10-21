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
      findAllPaged: jest.fn().mockReturnValue(of([]))
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
});
