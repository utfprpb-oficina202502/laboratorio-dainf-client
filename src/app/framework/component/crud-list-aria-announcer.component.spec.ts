import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CrudListAriaAnnouncerComponent} from './crud-list-aria-announcer.component';

describe('CrudListAriaAnnouncerComponent', () => {
  let component: CrudListAriaAnnouncerComponent;
  let fixture: ComponentFixture<CrudListAriaAnnouncerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudListAriaAnnouncerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CrudListAriaAnnouncerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not announce during loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('totalElements', 5);
    fixture.componentRef.setInput('entityName', 'empréstimo');
    fixture.componentRef.setInput('entityPluralName', 'empréstimos');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
    const span = liveRegion.querySelector('span');

    // Should not announce during loading (prevents spam)
    expect(span).toBeNull();
  });

  it('should announce empty state', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('totalElements', 0);
    fixture.componentRef.setInput('entityName', 'empréstimo');
    fixture.componentRef.setInput('entityPluralName', 'empréstimos');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
    expect(liveRegion.textContent).toContain('Nenhum empréstimo encontrado');
  });

  it('should announce single item count', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('totalElements', 1);
    fixture.componentRef.setInput('entityName', 'empréstimo');
    fixture.componentRef.setInput('entityPluralName', 'empréstimos');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
    expect(liveRegion.textContent).toContain('1 empréstimo carregado');
  });

  it('should announce multiple items count with plural', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('totalElements', 5);
    fixture.componentRef.setInput('entityName', 'empréstimo');
    fixture.componentRef.setInput('entityPluralName', 'empréstimos');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
    expect(liveRegion.textContent).toContain('5 empréstimos carregado');
  });

  it('should have correct ARIA attributes', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('totalElements', 0);
    fixture.componentRef.setInput('entityName', 'item');
    fixture.componentRef.setInput('entityPluralName', 'itens');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('should have sr-only class for screen readers only', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('totalElements', 0);
    fixture.componentRef.setInput('entityName', 'item');
    fixture.componentRef.setInput('entityPluralName', 'itens');
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('.sr-only');
    expect(liveRegion).toBeTruthy();
  });
});
