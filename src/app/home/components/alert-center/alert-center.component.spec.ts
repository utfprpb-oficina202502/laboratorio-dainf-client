import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AlertCenterComponent} from './alert-center.component';
import {provideRouter} from '@angular/router';
import {ALERT_DAYS_BEFORE_DUE, EstatisticasUsuario} from '../../models/dashboard.models';

/**
 * Factory para criar estatísticas de usuário para testes.
 */
function createMockStats(overrides: Partial<EstatisticasUsuario> = {}): EstatisticasUsuario {
  return {
    emprestimosEmAberto: 2,
    emprestimosEmAtraso: 0,
    emprestimosTotal: 15,
    proximaDevolucao: '2025-01-20',
    diasParaProximaDevolucao: 10,
    ...overrides
  };
}

describe('AlertCenterComponent', () => {
  let component: AlertCenterComponent;
  let fixture: ComponentFixture<AlertCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertCenterComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertCenterComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter stats como null por padrão', () => {
      expect(component.stats()).toBeNull();
    });

    it('deve ter alerts vazio quando stats é null', () => {
      expect(component['alerts']()).toEqual([]);
    });

    it('deve ter hasAlerts como false quando não há stats', () => {
      expect(component['hasAlerts']()).toBe(false);
    });
  });

  describe('Alerta de Atraso (vermelho)', () => {
    it('deve mostrar alerta quando há 1 empréstimo em atraso', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const alertaAtraso = alerts.find(a => a.type === 'atraso');
      expect(alertaAtraso).toBeDefined();
      expect(alertaAtraso?.severity).toBe('danger');
      expect(alertaAtraso?.message).toContain('1 empréstimo');
    });

    it('deve mostrar plural quando há múltiplos empréstimos em atraso', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 3});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaAtraso = alerts.find(a => a.type === 'atraso');
      expect(alertaAtraso?.message).toContain('3 empréstimos');
    });

    it('não deve mostrar alerta de atraso quando não há atrasos', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 0});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaAtraso = alerts.find(a => a.type === 'atraso');
      expect(alertaAtraso).toBeUndefined();
    });

    it('deve ter ícone de exclamation-triangle para alerta de atraso', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaAtraso = alerts.find(a => a.type === 'atraso');
      expect(alertaAtraso?.icon).toContain('pi-exclamation-triangle');
    });
  });

  describe('Alerta de Vencimento Próximo (amarelo)', () => {
    it('deve mostrar alerta quando devolução é hoje (0 dias)', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: 0});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeDefined();
      expect(alertaVencimento?.severity).toBe('warn');
      expect(alertaVencimento?.message).toContain('hoje');
    });

    it('deve mostrar alerta quando devolução é amanhã (1 dia)', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeDefined();
      expect(alertaVencimento?.message).toContain('amanhã');
    });

    it('deve mostrar alerta com dias quando devolução é em 3 dias', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: 3});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeDefined();
      expect(alertaVencimento?.message).toContain('3 dias');
    });

    it('deve mostrar alerta quando devolução está no limite (7 dias)', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: ALERT_DAYS_BEFORE_DUE});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeDefined();
    });

    it('não deve mostrar alerta quando devolução está além do limite (8 dias)', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: ALERT_DAYS_BEFORE_DUE + 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeUndefined();
    });

    it('não deve mostrar alerta quando diasParaProximaDevolucao é null', () => {
      // Arrange
      const stats = createMockStats({diasParaProximaDevolucao: null});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeUndefined();
    });

    it('não deve mostrar alerta quando diasParaProximaDevolucao é negativo (já atrasado)', () => {
      // Arrange - dias negativos indicam atraso, não vencimento próximo
      const stats = createMockStats({
        diasParaProximaDevolucao: -2,
        emprestimosEmAtraso: 1
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      const alertaVencimento = alerts.find(a => a.type === 'vencimento');
      expect(alertaVencimento).toBeUndefined();
    });
  });

  describe('Múltiplos Alertas', () => {
    it('deve mostrar ambos alertas quando há atraso e vencimento próximo', () => {
      // Arrange
      const stats = createMockStats({
        emprestimosEmAtraso: 2,
        diasParaProximaDevolucao: 3
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      expect(alerts.length).toBe(2);
      expect(alerts.some(a => a.type === 'atraso')).toBe(true);
      expect(alerts.some(a => a.type === 'vencimento')).toBe(true);
    });

    it('deve ter hasAlerts como true quando há alertas', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      expect(component['hasAlerts']()).toBe(true);
    });
  });

  describe('Sem Alertas', () => {
    it('não deve mostrar alertas quando tudo está ok', () => {
      // Arrange
      const stats = createMockStats({
        emprestimosEmAtraso: 0,
        diasParaProximaDevolucao: 15
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alerts = component['alerts']();
      expect(alerts.length).toBe(0);
      expect(component['hasAlerts']()).toBe(false);
    });

    it('não deve mostrar alertas quando não há empréstimos', () => {
      // Arrange
      const stats = createMockStats({
        emprestimosEmAberto: 0,
        emprestimosEmAtraso: 0,
        diasParaProximaDevolucao: null
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      expect(component['alerts']().length).toBe(0);
    });
  });

  describe('Renderização do Template', () => {
    it('não deve renderizar container quando não há alertas', () => {
      // Arrange
      const stats = createMockStats({
        emprestimosEmAtraso: 0,
        diasParaProximaDevolucao: 15
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alertContainer = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alertContainer).toBeNull();
    });

    it('deve renderizar container com role="alert" quando há alertas', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert
      const alertContainer = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alertContainer).toBeTruthy();
    });

    it('deve aplicar estilos de danger para alerta de atraso', () => {
      // Arrange
      const stats = createMockStats({emprestimosEmAtraso: 1});

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert - verifica se o alerta tem background vermelho (rgba com cor de danger)
      const alertElement = fixture.nativeElement.querySelector('[role="alert"] .rounded-lg');
      expect(alertElement).toBeTruthy();
      expect(alertElement.style.background).toContain('rgba(239, 68, 68');
    });

    it('deve aplicar estilos de warn para alerta de vencimento', () => {
      // Arrange
      const stats = createMockStats({
        emprestimosEmAtraso: 0,
        diasParaProximaDevolucao: 3
      });

      // Act
      fixture.componentRef.setInput('stats', stats);
      fixture.detectChanges();

      // Assert - verifica se o alerta tem background amarelo (rgba com cor de warn)
      const alertElement = fixture.nativeElement.querySelector('[role="alert"] .rounded-lg');
      expect(alertElement).toBeTruthy();
      expect(alertElement.style.background).toContain('rgba(245, 158, 11');
    });
  });
});
