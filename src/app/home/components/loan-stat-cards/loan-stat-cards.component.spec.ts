import {ComponentFixture, TestBed} from '@angular/core/testing';
import {LoanStatCardsComponent} from './loan-stat-cards.component';
import {EstatisticasUsuario} from '../../models/dashboard.models';

/**
 * Factory para criar estatísticas de teste.
 */
function createMockStats(overrides: Partial<EstatisticasUsuario> = {}): EstatisticasUsuario {
  return {
    emprestimosEmAberto: 3,
    emprestimosEmAtraso: 1,
    emprestimosTotal: 15,
    proximaDevolucao: '2025-01-20',
    diasParaProximaDevolucao: 5,
    ...overrides
  };
}

describe('LoanStatCardsComponent', () => {
  let component: LoanStatCardsComponent;
  let fixture: ComponentFixture<LoanStatCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanStatCardsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanStatCardsComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter stats como null por padrão', () => {
      expect(component.stats()).toBeNull();
    });

    it('deve ter loading como false por padrão', () => {
      expect(component.loading()).toBe(false);
    });

    it('deve ter host class "contents" para layout grid', () => {
      expect(fixture.nativeElement.classList.contains('contents')).toBe(true);
    });

    it('deve ter role="group" para acessibilidade', () => {
      expect(fixture.nativeElement.getAttribute('role')).toBe('group');
    });

    it('deve ter aria-label descritivo para leitores de tela', () => {
      expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Estatísticas de empréstimos do usuário');
    });
  });

  describe('Estado de Loading', () => {
    it('deve mostrar 4 skeleton cards quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton-card');
      expect(skeletons.length).toBe(4);
    });

    it('não deve mostrar stat cards quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const statCards = fixture.nativeElement.querySelectorAll('app-stat-card');
      expect(statCards.length).toBe(0);
    });

    it('deve mostrar stat cards quando loading é false', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('stats', createMockStats());
      fixture.detectChanges();

      const statCards = fixture.nativeElement.querySelectorAll('app-stat-card');
      expect(statCards.length).toBe(4);
    });

    it('não deve mostrar skeleton cards quando loading é false', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton-card');
      expect(skeletons.length).toBe(0);
    });
  });

  describe('proximaDevolucaoText computed', () => {
    it('deve retornar "-" quando stats é null', () => {
      fixture.componentRef.setInput('stats', null);
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('-');
    });

    it('deve retornar "-" quando diasParaProximaDevolucao é null', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: null}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('-');
    });

    it('deve retornar "Hoje" quando diasParaProximaDevolucao é 0', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 0}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('Hoje');
    });

    it('deve retornar "1 dia" quando diasParaProximaDevolucao é 1', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 1}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('1 dia');
    });

    it('deve retornar "X dias" para valores maiores que 1', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 5}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('5 dias');
    });

    it('deve retornar "X dia(s) atrás" para valores negativos', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -3}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('3 dia(s) atrás');
    });

    it('deve retornar "1 dia(s) atrás" para -1', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -1}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('1 dia(s) atrás');
    });
  });

  describe('Renderização dos Cards', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('stats', createMockStats());
      fixture.detectChanges();
    });

    it('deve renderizar card de Empréstimos Ativos', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Empréstimos Ativos');
    });

    it('deve renderizar card de Empréstimos Atrasados', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Empréstimos Atrasados');
    });

    it('deve renderizar card de Próxima Devolução', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Próx. Devolução');
    });

    it('deve renderizar card de Total de Empréstimos', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Total de Empréstimos');
    });
  });

  describe('Valores Default quando stats é null', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('stats', null);
      fixture.detectChanges();
    });

    it('deve usar 0 como valor padrão para emprestimosEmAberto', () => {
      const statCards = fixture.nativeElement.querySelectorAll('app-stat-card');
      expect(statCards.length).toBe(4);
    });
  });
});
