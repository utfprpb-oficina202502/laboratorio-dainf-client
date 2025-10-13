import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TableEmptyStateComponent} from './table-empty-state.component';

describe('TableEmptyStateComponent', () => {
  let component: TableEmptyStateComponent;
  let fixture: ComponentFixture<TableEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableEmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableEmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty message with default icon', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Nenhum registro encontrado');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const icon = compiled.querySelector('i');
    const message = compiled.querySelector('p');

    expect(icon.classList.contains('pi-info-circle')).toBe(true);
    expect(message.textContent).toContain('Nenhum registro encontrado');
  });

  it('should render with custom icon', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Erro ao carregar');
    fixture.componentRef.setInput('icon', 'pi-exclamation-triangle');
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('i');
    expect(icon.classList.contains('pi-exclamation-triangle')).toBe(true);
  });

  it('should apply correct colspan', () => {
    fixture.componentRef.setInput('colspan', 7);
    fixture.componentRef.setInput('message', 'Test');
    fixture.detectChanges();

    const td = fixture.nativeElement.querySelector('td');
    expect(td.getAttribute('colspan')).toBe('7');
  });

  it('should not show action button by default', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Test');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeNull();
  });

  it('should show action button when enabled', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentRef.setInput('showAction', true);
    fixture.componentRef.setInput('actionLabel', 'Tentar Novamente');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('Tentar Novamente');
  });
});
