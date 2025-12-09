import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivityTimelineComponent} from './activity-timeline.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from '@angular/router';
import {AtividadeUsuario} from '../../models/dashboard.models';

/**
 * Factory para criar atividades de teste.
 */
function createMockActivity(overrides: Partial<AtividadeUsuario> = {}): AtividadeUsuario {
  return {
    dataHora: '2025-01-15T10:30:00',
    tipo: 'EMPRESTIMO_RETIRADA',
    titulo: 'Retirada de Empréstimo',
    descricao: 'Multímetro Digital retirado',
    referenciaId: 123,
    referenciaTipo: 'EMPRESTIMO',
    ...overrides
  };
}

describe('ActivityTimelineComponent', () => {
  let component: ActivityTimelineComponent;
  let fixture: ComponentFixture<ActivityTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTimelineComponent],
      providers: [
        provideAnimationsAsync(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTimelineComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter activities como array vazio por padrão', () => {
      expect(component.activities()).toEqual([]);
    });

    it('deve ter loading como false por padrão', () => {
      expect(component.loading()).toBe(false);
    });

    it('deve ter hasActivities como false quando não há atividades', () => {
      fixture.detectChanges();
      expect(component['hasActivities']()).toBe(false);
    });
  });

  describe('Transformação de Atividades (timelineItems)', () => {
    it('deve retornar array vazio quando não há atividades', () => {
      fixture.componentRef.setInput('activities', []);
      fixture.detectChanges();

      expect(component['timelineItems']()).toEqual([]);
    });

    it('deve transformar atividades em timelineItems', () => {
      const activities = [createMockActivity()];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items).toHaveLength(1);
      expect(items[0].activity).toEqual(activities[0]);
      expect(items[0].icon).toBeDefined();
      expect(items[0].color).toBeDefined();
      expect(items[0].formattedDate).toBeDefined();
      expect(items[0].normalizedTitulo).toBeDefined();
      expect(items[0].normalizedDescricao).toBeDefined();
    });

    it('deve atribuir ícone correto para EMPRESTIMO_RETIRADA', () => {
      const activities = [createMockActivity({tipo: 'EMPRESTIMO_RETIRADA'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].icon).toBe('pi pi-arrow-up-right');
      expect(items[0].color).toBe('#3B82F6');
    });

    it('deve atribuir ícone correto para EMPRESTIMO_DEVOLUCAO', () => {
      const activities = [createMockActivity({tipo: 'EMPRESTIMO_DEVOLUCAO'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].icon).toBe('pi pi-check');
      expect(items[0].color).toBe('#22C55E');
    });

    it('deve atribuir ícone correto para RESERVA_CRIADA', () => {
      const activities = [createMockActivity({tipo: 'RESERVA_CRIADA'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].icon).toBe('pi pi-calendar-plus');
      expect(items[0].color).toBe('#F59E0B');
    });

    it('deve usar ícone padrão para tipo desconhecido', () => {
      const activities = [createMockActivity({tipo: 'TIPO_DESCONHECIDO' as any})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].icon).toBe('pi pi-circle');
      expect(items[0].color).toBe('#6B7280');
    });
  });

  describe('Cálculo de Period Label', () => {
    it('deve retornar "Hoje" para atividades de hoje', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
      const activities = [createMockActivity({dataHora: today.toISOString()})];

      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].periodLabel).toBe('Hoje');
    });

    it('deve retornar "Ontem" para atividades de ontem', () => {
      const now = new Date();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0);
      const activities = [createMockActivity({dataHora: yesterday.toISOString()})];

      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].periodLabel).toBe('Ontem');
    });

    it('deve retornar "Esta semana" para atividades dos últimos 7 dias', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 14, 0);
      const activities = [createMockActivity({dataHora: threeDaysAgo.toISOString()})];

      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].periodLabel).toBe('Esta semana');
    });

    it('deve retornar "Mais antigo" para atividades com mais de 7 dias', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 14, 0);
      const activities = [createMockActivity({dataHora: tenDaysAgo.toISOString()})];

      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].periodLabel).toBe('Mais antigo');
    });
  });

  describe('Normalização de Acentos (normalizeAccents)', () => {
    it('deve corrigir "Devolucao" para "Devolução"', () => {
      const activities = [createMockActivity({titulo: 'Devolucao de itens'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].normalizedTitulo).toBe('Devolução de itens');
    });

    it('deve corrigir "Emprestimo" para "Empréstimo"', () => {
      const activities = [createMockActivity({titulo: 'Emprestimo realizado'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].normalizedTitulo).toBe('Empréstimo realizado');
    });

    it('deve corrigir múltiplas palavras no mesmo texto', () => {
      const activities = [createMockActivity({
        titulo: 'Devolucao do Emprestimo',
        descricao: 'Situacao do emprestimo'
      })];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].normalizedTitulo).toBe('Devolução do Empréstimo');
      expect(items[0].normalizedDescricao).toBe('Situação do empréstimo');
    });

    it('deve manter texto original se não houver correções necessárias', () => {
      const activities = [createMockActivity({titulo: 'Texto correto'})];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      expect(items[0].normalizedTitulo).toBe('Texto correto');
    });

    it('deve lidar com texto vazio', () => {
      const result = (component as any).normalizeAccents('');
      expect(result).toBe('');
    });

    it('deve lidar com texto null', () => {
      const result = (component as any).normalizeAccents(null);
      expect(result).toBeNull();
    });

    it('deve lidar com texto undefined', () => {
      const result = (component as any).normalizeAccents(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('Formatação de Data (formatDate)', () => {
    it('deve formatar data no padrão dd/mm/yyyy', () => {
      const date = new Date(2025, 0, 15, 10, 30); // 15/01/2025
      const result = (component as any).formatDate(date);

      expect(result).toBe('15/01/2025');
    });

    it('deve adicionar zeros à esquerda para dia < 10', () => {
      const date = new Date(2025, 0, 5, 10, 30); // 05/01/2025
      const result = (component as any).formatDate(date);

      expect(result).toBe('05/01/2025');
    });

    it('deve adicionar zeros à esquerda para mês < 10', () => {
      const date = new Date(2025, 8, 15, 10, 30); // 15/09/2025
      const result = (component as any).formatDate(date);

      expect(result).toBe('15/09/2025');
    });
  });

  describe('Formatação de Hora (formatTime)', () => {
    it('deve formatar hora no padrão HH:mm', () => {
      const date = new Date(2025, 0, 15, 14, 30);
      const result = (component as any).formatTime(date);

      expect(result).toBe('14:30');
    });

    it('deve adicionar zeros à esquerda para hora < 10', () => {
      const date = new Date(2025, 0, 15, 9, 5);
      const result = (component as any).formatTime(date);

      expect(result).toBe('09:05');
    });
  });

  describe('Geração de Router Link (getRouterLink)', () => {
    it('deve gerar rota para empréstimo', () => {
      const activities = [createMockActivity({
        referenciaTipo: 'EMPRESTIMO',
        referenciaId: 123
      })];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      const link = component['getRouterLink'](items[0]);

      expect(link).toEqual(['/emprestimo/form', '123']);
    });

    it('deve gerar rota para reserva', () => {
      const activities = [createMockActivity({
        referenciaTipo: 'RESERVA',
        referenciaId: 456
      })];
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const items = component['timelineItems']();
      const link = component['getRouterLink'](items[0]);

      expect(link).toEqual(['/reserva/form', '456']);
    });
  });

  describe('hasActivities computed', () => {
    it('deve retornar true quando há atividades', () => {
      fixture.componentRef.setInput('activities', [createMockActivity()]);
      fixture.detectChanges();

      expect(component['hasActivities']()).toBe(true);
    });

    it('deve retornar false quando não há atividades', () => {
      fixture.componentRef.setInput('activities', []);
      fixture.detectChanges();

      expect(component['hasActivities']()).toBe(false);
    });
  });

  describe('Renderização do Template', () => {
    it('deve mostrar skeleton quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve mostrar mensagem de vazio quando não há atividades', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('activities', []);
      fixture.detectChanges();

      const emptyMessage = fixture.nativeElement.textContent;
      expect(emptyMessage).toContain('Nenhuma atividade recente');
    });

    it('deve mostrar atividades quando há dados', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('activities', [createMockActivity()]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Retirada de Empréstimo');
    });

    it('deve ter título "Atividades Recentes"', () => {
      fixture.detectChanges();

      const title = fixture.nativeElement.textContent;
      expect(title).toContain('Atividades Recentes');
    });

    it('não deve mostrar badge "Mais antigo" no template', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 14, 0);
      const activities = [createMockActivity({dataHora: tenDaysAgo.toISOString()})];

      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      // O periodLabel "Mais antigo" não deve aparecer como badge
      const badges = fixture.nativeElement.querySelectorAll('.rounded-full');
      const badgeTexts = Array.from(badges).map((b: any) => b.textContent.trim());
      expect(badgeTexts).not.toContain('Mais antigo');
    });

    it('deve mostrar badge "Hoje" no template', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
      const activities = [createMockActivity({dataHora: today.toISOString()})];

      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('activities', activities);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Hoje');
    });
  });
});
