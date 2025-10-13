import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TableLoadingStateComponent} from './table-loading-state.component';

describe('TableLoadingStateComponent', () => {
  let component: TableLoadingStateComponent;
  let fixture: ComponentFixture<TableLoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableLoadingStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableLoadingStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render loading message', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Carregando dados...');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('p');
    expect(message.textContent).toContain('Carregando dados...');
  });

  it('should not show spinner by default', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Carregando...');
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.pi-spinner');
    expect(spinner).toBeNull();
  });

  it('should show spinner when enabled', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Carregando...');
    fixture.componentRef.setInput('showSpinner', true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.pi-spinner');
    expect(spinner).toBeTruthy();
    expect(spinner.classList.contains('pi-spin')).toBe(true);
  });

  it('should apply correct colspan', () => {
    fixture.componentRef.setInput('colspan', 8);
    fixture.componentRef.setInput('message', 'Test');
    fixture.detectChanges();

    const td = fixture.nativeElement.querySelector('td');
    expect(td.getAttribute('colspan')).toBe('8');
  });

  it('should apply custom message class', () => {
    fixture.componentRef.setInput('colspan', 5);
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentRef.setInput('messageClass', 'custom-class');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('p');
    expect(message.classList.contains('custom-class')).toBe(true);
  });
});
