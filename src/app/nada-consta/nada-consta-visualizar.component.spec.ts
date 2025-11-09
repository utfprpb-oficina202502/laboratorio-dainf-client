import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {NadaConstaVisualizarComponent} from './nada-consta-visualizar.component';
import {NadaConstaService, NadaConsta} from './nada-consta.service';
import {of, throwError} from 'rxjs';

describe('NadaConstaVisualizarComponent', () => {
  let fixture: any;
  let component: NadaConstaVisualizarComponent;
  let service: NadaConstaService;

  beforeEach(async () => {
    const serviceMock = {
      consultarNadaConsta: jest.fn()
    };
    await TestBed.configureTestingModule({
      providers: [
        { provide: NadaConstaService, useValue: serviceMock }
      ],
      imports: [NadaConstaVisualizarComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(NadaConstaVisualizarComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NadaConstaService);
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir erro se id não informado', () => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    component.id = null;
    component.consultar();
    expect(component.erro).toBe('Informe o ID do registro.');
    expect(component.resultado).toBeNull();
    expect(component.liveRegionText).toBe('Informe o ID do registro.');
    expect(spy).toHaveBeenCalled();
  });

  it('deve consultar registro com id válido', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    const mockNadaConsta: NadaConsta = {
      id: 1,
      usuario: { id: 1, nome: 'Teste', username: 'teste', documento: '', email: '', telefone: '', permissoes: [], fotoUrl: null, codigoVerificacao: '', ativo: true, authorities: [], accountNonExpired: true, accountNonLocked: true, credentialsNonExpired: true, enabled: true },
      status: 'ATIVO', sendAt: '', createdAt: '', updatedAt: '', createdBy: '', updatedBy: ''
    };
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(of(mockNadaConsta));
    component.id = 1;
    component.consultar();
    tick();
    expect(component.resultado).toEqual(mockNadaConsta);
    expect(component.erro).toBeNull();
    expect(component.carregando).toBe(false);
    expect(component.liveRegionText).toContain('Consulta concluída. Registro ID 1');
    expect(spy).toHaveBeenCalled();
  }));

  it('deve tratar erro ao consultar registro', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Não encontrado' } })));
    component.id = 99;
    component.consultar();
    tick();
    expect(component.resultado).toBeNull();
    expect(component.erro).toBe('Não encontrado');
    expect(component.carregando).toBe(false);
    expect(component.liveRegionText).toBe('Não encontrado');
    expect(spy).toHaveBeenCalled();
  }));

  it('deve iniciar com estado padrão', () => {
    expect(component.id).toBeNull();
    expect(component.resultado).toBeNull();
    expect(component.erro).toBeNull();
    expect(component.carregando).toBe(false);
    expect(component.liveRegionText).toBe('');
  });

  it('deve exibir erro se id for zero', () => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    component.id = 0;
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Não encontrado' } })));
    component.consultar();
    expect(component.erro).toBe('Não encontrado');
    expect(component.resultado).toBeNull();
    expect(component.liveRegionText).toBe('Não encontrado');
    expect(spy).toHaveBeenCalled();
  });

  it('deve exibir erro se id for negativo', () => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    component.id = -1;
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Não encontrado' } })));
    component.consultar();
    expect(component.erro).toBe('Não encontrado');
    expect(component.resultado).toBeNull();
    expect(component.liveRegionText).toBe('Não encontrado');
    expect(spy).toHaveBeenCalled();
  });

  it('deve atualizar liveRegionText corretamente em consulta', fakeAsync(() => {
    const mockNadaConsta: NadaConsta = {
      id: 2,
      usuario: { id: 2, nome: 'Outro', username: 'outro', documento: '', email: '', telefone: '', permissoes: [], fotoUrl: null, codigoVerificacao: '', ativo: true, authorities: [], accountNonExpired: true, accountNonLocked: true, credentialsNonExpired: true, enabled: true },
      status: 'PENDENTE', sendAt: '', createdAt: '', updatedAt: '', createdBy: '', updatedBy: ''
    };
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(of(mockNadaConsta));
    component.id = 2;
    component.consultar();
    tick();
    expect(component.liveRegionText).toContain('Consulta concluída. Registro ID 2');
    expect(component.liveRegionText).toContain('usuário Outro');
    expect(component.liveRegionText).toContain('status PENDENTE');
  }));

  it('deve cancelar consulta anterior ao destruir', fakeAsync(() => {
    const spy = jest.spyOn((component as any).destroyed$, 'next');
    const spyComplete = jest.spyOn((component as any).destroyed$, 'complete');
    component.id = 3;
    (service.consultarNadaConsta as jest.Mock).mockReturnValueOnce(of({
      id: 3,
      usuario: { id: 3, nome: 'Cancelado', username: 'cancelado', documento: '', email: '', telefone: '', permissoes: [], fotoUrl: null, codigoVerificacao: '', ativo: true, authorities: [], accountNonExpired: true, accountNonLocked: true, credentialsNonExpired: true, enabled: true },
      status: 'PENDENTE', sendAt: '', createdAt: '', updatedAt: '', createdBy: '', updatedBy: ''
    }));
    component.consultar();
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    expect(spyComplete).toHaveBeenCalled();
  }));

  it('deve completar destroyed$ no ngOnDestroy', () => {
    const spy = jest.spyOn((component as any).destroyed$, 'next');
    const spyComplete = jest.spyOn((component as any).destroyed$, 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    expect(spyComplete).toHaveBeenCalled();
  });
});
