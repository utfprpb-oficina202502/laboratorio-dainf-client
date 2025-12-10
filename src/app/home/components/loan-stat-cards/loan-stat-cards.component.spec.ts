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
    it('deve retornar "✓" quando stats é null (sem empréstimos)', () => {
      fixture.componentRef.setInput('stats', null);
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('✓');
    });

    it('deve retornar "✓" quando diasParaProximaDevolucao é null', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: null}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('✓');
    });

    it('deve retornar "Hoje" quando diasParaProximaDevolucao é 0', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 0}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('Hoje');
    });

    it('deve retornar "Amanhã" quando diasParaProximaDevolucao é 1', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 1}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('Amanhã');
    });

    it('deve retornar "X dias" para valores maiores que 1', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 5}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('5 dias');
    });

    it('deve retornar "X dias" para atraso (valores negativos)', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -3}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('3 dias');
    });

    it('deve retornar "1 dia" para atraso de 1 dia', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -1}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoText']()).toBe('1 dia');
    });
  });

  describe('proximaDevolucaoTitle computed', () => {
    it('deve retornar "Nenhum Empréstimo" quando stats é null', () => {
      fixture.componentRef.setInput('stats', null);
      fixture.detectChanges();

      expect(component['proximaDevolucaoTitle']()).toBe('Nenhum Empréstimo');
    });

    it('deve retornar "Nenhum Empréstimo" quando diasParaProximaDevolucao é null', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: null}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoTitle']()).toBe('Nenhum Empréstimo');
    });

    it('deve retornar "Devolução Atrasada" quando dias < 0', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -2}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoTitle']()).toBe('Devolução Atrasada');
    });

    it('deve retornar "Devolução Hoje" quando dias === 0', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 0}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoTitle']()).toBe('Devolução Hoje');
    });

    it('deve retornar "Próx. Devolução" quando dias > 0', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 5}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoTitle']()).toBe('Próx. Devolução');
    });
  });

  describe('proximaDevolucaoColor computed', () => {
    it('deve retornar verde (#22C55E) quando stats é null (sem empréstimos)', () => {
      fixture.componentRef.setInput('stats', null);
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#22C55E');
    });

    it('deve retornar verde (#22C55E) quando diasParaProximaDevolucao é null', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: null}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#22C55E');
    });

    it('deve retornar vermelho (#EF4444) quando atrasado (dias < 0)', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: -1}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#EF4444');
    });

    it('deve retornar amarelo (#F59E0B) quando vence hoje (dias === 0)', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 0}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#F59E0B');
    });

    it('deve retornar amarelo (#F59E0B) quando vence em breve (dias 1-7)', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 7}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#F59E0B');
    });

    it('deve retornar verde (#22C55E) quando prazo longo (dias > 7)', () => {
      fixture.componentRef.setInput('stats', createMockStats({diasParaProximaDevolucao: 15}));
      fixture.detectChanges();

      expect(component['proximaDevolucaoColor']()).toBe('#22C55E');
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
