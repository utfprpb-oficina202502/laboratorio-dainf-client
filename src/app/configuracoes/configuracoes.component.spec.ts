import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {ConfiguracoesComponent} from './configuracoes.component';
import {ConfiguracoesService} from './configuracoes.service';
import {Router} from '@angular/router';
import {of, throwError} from 'rxjs';

describe('ConfiguracoesComponent', () => {
  let fixture: any;
  let component: ConfiguracoesComponent;
  let service: ConfiguracoesService;
  let router: Router;

  beforeEach(async () => {
    const serviceMock = {
      getConfiguracoes: jest.fn(),
      salvarConfiguracoes: jest.fn()
    };
    const routerMock = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      providers: [
        { provide: ConfiguracoesService, useValue: serviceMock },
        { provide: Router, useValue: routerMock }
      ],
      imports: [ConfiguracoesComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfiguracoesComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ConfiguracoesService);
    router = TestBed.inject(Router);
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar configuracoes com sucesso', () => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.getConfiguracoes as jest.Mock).mockReturnValueOnce(of({ nadaConstaEmail: 'admin@utfpr.edu.br' }));
    component.carregarConfiguracoes();
    expect(component.getNadaConstaEmail()).toBe('admin@utfpr.edu.br');
    expect(component.getIsLoading()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('deve tratar erro ao carregar configuracoes', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.getConfiguracoes as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Erro ao carregar' } })));
    component.carregarConfiguracoes();
    tick();
    expect(component.getIsLoading()).toBe(false);
    expect(spy).toHaveBeenCalled();
  }));

  it('deve enviar configuracoes com sucesso e navegar', fakeAsync(() => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.salvarConfiguracoes as jest.Mock).mockReturnValueOnce(of({ sucesso: true }));
    component.setNadaConstaEmail('admin@utfpr.edu.br');
    component.enviar();
    expect(component.getSuccess()).toBe(true);
    expect(component.getIsLoading()).toBe(false);
    expect(spy).toHaveBeenCalled();
    tick(1300);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('deve tratar erro ao enviar configuracoes', () => {
    const spy = jest.spyOn(component.getCdr(), 'markForCheck');
    (service.salvarConfiguracoes as jest.Mock).mockReturnValueOnce(throwError(() => ({ error: { message: 'Erro ao salvar' } })));
    component.setNadaConstaEmail('admin@utfpr.edu.br');
    component.enviar();
    expect(component.getError()).toContain('Erro ao salvar');
    expect(component.getIsLoading()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});
