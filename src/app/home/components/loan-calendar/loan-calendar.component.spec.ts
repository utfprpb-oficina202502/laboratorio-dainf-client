import {ComponentFixture, TestBed} from '@angular/core/testing';
import {LoanCalendarComponent} from './loan-calendar.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {CALENDAR_EVENT_COLORS, EventoCalendario} from '../../models/dashboard.models';

/**
 * Factory para criar eventos de calendário para testes.
 */
function createMockEvents(): EventoCalendario[] {
  return [
    {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Multímetro Digital'},
    {
      data: '2025-01-20',
      tipo: 'DEVOLUCAO_PREVISTA',
      emprestimoId: 123,
      descricao: 'Multímetro Digital'
    },
    {data: '2025-01-10', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Osciloscópio'},
    {data: '2025-01-05', tipo: 'ATRASADO', emprestimoId: 115, descricao: 'Fonte de Alimentação'}
  ];
}

/**
 * Factory para criar objeto de data do p-datepicker.
 */
function createDateObject(year: number, month: number, day: number): {
  day: number;
  month: number;
  year: number
} {
  return {year, month, day};
}

describe('LoanCalendarComponent', () => {
  let component: LoanCalendarComponent;
  let fixture: ComponentFixture<LoanCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanCalendarComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(LoanCalendarComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter events como array vazio por padrão', () => {
      expect(component.events()).toEqual([]);
    });

    it('deve ter loading como false por padrão', () => {
      expect(component.loading()).toBe(false);
    });

    it('deve ter selectedDate como null por padrão', () => {
      expect(component['selectedDate']()).toBeNull();
    });

    it('deve ter eventColors configurado corretamente', () => {
      expect(component['eventColors']).toEqual(CALENDAR_EVENT_COLORS);
    });
  });

  describe('Agrupamento de Eventos por Data (eventsByDate)', () => {
    it('deve agrupar eventos por data corretamente', () => {
      // Arrange
      const mockEvents = createMockEvents();

      // Act
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      // Assert
      const eventsByDate = component['eventsByDate']();
      expect(eventsByDate['2025-01-15']).toHaveLength(1);
      expect(eventsByDate['2025-01-20']).toHaveLength(1);
      expect(eventsByDate['2025-01-10']).toHaveLength(1);
      expect(eventsByDate['2025-01-05']).toHaveLength(1);
    });

    it('deve agrupar múltiplos eventos na mesma data', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-15', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Item B'}
      ];

      // Act
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      // Assert
      const eventsByDate = component['eventsByDate']();
      expect(eventsByDate['2025-01-15']).toHaveLength(2);
    });

    it('deve retornar objeto vazio quando não há eventos', () => {
      // Arrange & Act
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      // Assert
      const eventsByDate = component['eventsByDate']();
      expect(Object.keys(eventsByDate)).toHaveLength(0);
    });
  });

  describe('Verificação de Eventos (hasEvents)', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents();
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();
    });

    it('deve retornar true para data com eventos', () => {
      // Arrange - Janeiro é mês 0 no JS
      const date = createDateObject(2025, 0, 15);

      // Act & Assert
      expect(component.hasEvents(date)).toBe(true);
    });

    it('deve retornar false para data sem eventos', () => {
      // Arrange
      const date = createDateObject(2025, 0, 25);

      // Act & Assert
      expect(component.hasEvents(date)).toBe(false);
    });

    it('deve retornar false para data em mês diferente', () => {
      // Arrange - Fevereiro (mês 1)
      const date = createDateObject(2025, 1, 15);

      // Act & Assert
      expect(component.hasEvents(date)).toBe(false);
    });
  });

  describe('Obtenção de Eventos por Data (getEventsForDate)', () => {
    beforeEach(() => {
      const mockEvents = createMockEvents();
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();
    });

    it('deve retornar eventos para data específica', () => {
      // Arrange
      const date = createDateObject(2025, 0, 15);

      // Act
      const events = component.getEventsForDate(date);

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0].tipo).toBe('RETIRADA');
    });

    it('deve retornar array vazio para data sem eventos', () => {
      // Arrange
      const date = createDateObject(2025, 0, 25);

      // Act
      const events = component.getEventsForDate(date);

      // Assert
      expect(events).toEqual([]);
    });
  });

  describe('Cor Dominante (getDominantColor)', () => {
    it('deve retornar cor de ATRASADO como prioridade máxima', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-15', tipo: 'ATRASADO', emprestimoId: 120, descricao: 'Item B'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const color = component.getDominantColor(date);

      // Assert
      expect(color).toBe(CALENDAR_EVENT_COLORS.ATRASADO);
    });

    it('deve retornar cor de DEVOLUCAO_PREVISTA como segunda prioridade', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-15', tipo: 'DEVOLUCAO_PREVISTA', emprestimoId: 120, descricao: 'Item B'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const color = component.getDominantColor(date);

      // Assert
      expect(color).toBe(CALENDAR_EVENT_COLORS.DEVOLUCAO_PREVISTA);
    });

    it('deve retornar cor de RETIRADA como terceira prioridade', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-15', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Item B'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const color = component.getDominantColor(date);

      // Assert
      expect(color).toBe(CALENDAR_EVENT_COLORS.RETIRADA);
    });

    it('deve retornar cor de DEVOLUCAO_REALIZADA quando é o único tipo', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 123, descricao: 'Item A'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const color = component.getDominantColor(date);

      // Assert
      expect(color).toBe(CALENDAR_EVENT_COLORS.DEVOLUCAO_REALIZADA);
    });

    it('deve retornar null para data sem eventos', () => {
      // Arrange
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const color = component.getDominantColor(date);

      // Assert
      expect(color).toBeNull();
    });
  });

  describe('Tooltip (getTooltip)', () => {
    it('deve retornar tooltip formatado corretamente', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Multímetro Digital'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const tooltip = component.getTooltip(date);

      // Assert
      expect(tooltip).toContain('Retirada');
      expect(tooltip).toContain('Multímetro Digital');
    });

    it('deve retornar múltiplas linhas para múltiplos eventos', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-15', tipo: 'DEVOLUCAO_PREVISTA', emprestimoId: 124, descricao: 'Item B'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const tooltip = component.getTooltip(date);

      // Assert
      expect(tooltip).toContain('Retirada');
      expect(tooltip).toContain('Devolução prevista');
      expect(tooltip.split('\n').length).toBe(2);
    });

    it('deve retornar string vazia para data sem eventos', () => {
      // Arrange
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const date = createDateObject(2025, 0, 15);

      // Act
      const tooltip = component.getTooltip(date);

      // Assert
      expect(tooltip).toBe('');
    });

    it('deve usar label correto para cada tipo de evento', () => {
      // Arrange
      const mockEvents: EventoCalendario[] = [
        {data: '2025-01-10', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Test'},
        {data: '2025-01-11', tipo: 'ATRASADO', emprestimoId: 121, descricao: 'Test2'}
      ];
      fixture.componentRef.setInput('events', mockEvents);
      fixture.detectChanges();

      // Act & Assert
      const tooltip1 = component.getTooltip(createDateObject(2025, 0, 10));
      expect(tooltip1).toContain('Devolvido');

      const tooltip2 = component.getTooltip(createDateObject(2025, 0, 11));
      expect(tooltip2).toContain('Atrasado');
    });
  });

  describe('Formatação de Data (formatDateKey)', () => {
    it('deve formatar data corretamente para YYYY-MM-DD', () => {
      // Arrange
      const date = createDateObject(2025, 0, 15); // Janeiro

      // Act - usando método privado via cast
      const result = (component as any).formatDateKey(date);

      // Assert
      expect(result).toBe('2025-01-15');
    });

    it('deve adicionar zero à esquerda para mês < 10', () => {
      // Arrange
      const date = createDateObject(2025, 8, 5); // Setembro (mês 8 = 09)

      // Act
      const result = (component as any).formatDateKey(date);

      // Assert
      expect(result).toBe('2025-09-05');
    });

    it('deve adicionar zero à esquerda para dia < 10', () => {
      // Arrange
      const date = createDateObject(2025, 11, 1); // Dezembro (mês 11 = 12)

      // Act
      const result = (component as any).formatDateKey(date);

      // Assert
      expect(result).toBe('2025-12-01');
    });
  });

  describe('Renderização do Template', () => {
    it('deve mostrar skeleton quando loading é true', () => {
      // Arrange & Act
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      // Assert
      const skeleton = fixture.nativeElement.querySelector('p-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('deve mostrar calendário quando loading é false', () => {
      // Arrange & Act
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      // Assert
      const datepicker = fixture.nativeElement.querySelector('p-datepicker');
      expect(datepicker).toBeTruthy();
    });

    it('deve mostrar legenda de cores', () => {
      // Arrange & Act
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      // Assert
      const legend = fixture.nativeElement.textContent;
      expect(legend).toContain('Retirada');
      expect(legend).toContain('Devolução prevista');
      expect(legend).toContain('Devolvido');
      expect(legend).toContain('Atrasado');
    });

    it('deve ter título "Meu Calendário"', () => {
      // Arrange & Act
      fixture.detectChanges();

      // Assert
      const title = fixture.nativeElement.textContent;
      expect(title).toContain('Meu Calendário');
    });
  });

  describe('Cores de Eventos', () => {
    it('deve ter cores corretas definidas', () => {
      expect(CALENDAR_EVENT_COLORS.RETIRADA).toBe('#3B82F6'); // Azul
      expect(CALENDAR_EVENT_COLORS.DEVOLUCAO_PREVISTA).toBe('#F59E0B'); // Amarelo
      expect(CALENDAR_EVENT_COLORS.DEVOLUCAO_REALIZADA).toBe('#22C55E'); // Verde
      expect(CALENDAR_EVENT_COLORS.ATRASADO).toBe('#EF4444'); // Vermelho
    });
  });
});
