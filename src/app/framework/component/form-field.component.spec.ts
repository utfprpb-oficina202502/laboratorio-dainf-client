import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, Validators} from '@angular/forms';
import {FormFieldComponent} from './form-field.component';
import {FormValidationService} from '../services/form-validation.service';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
      providers: [FormValidationService]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('renderizacao basica', () => {
    it('deve renderizar label quando fornecido', () => {
      fixture.componentRef.setInput('label', 'Nome');
      fixture.componentRef.setInput('control', new FormControl(''));
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Nome');
    });

    it('nao deve renderizar label quando nao fornecido', () => {
      fixture.componentRef.setInput('control', new FormControl(''));
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label');
      expect(label).toBeNull();
    });

    it('deve renderizar asterisco quando required', () => {
      fixture.componentRef.setInput('label', 'Nome');
      fixture.componentRef.setInput('required', true);
      fixture.componentRef.setInput('control', new FormControl(''));
      fixture.detectChanges();

      const asterisk = fixture.nativeElement.querySelector('span.text-red-500');
      expect(asterisk).toBeTruthy();
      expect(asterisk.textContent).toContain('*');
    });

    it('nao deve renderizar asterisco quando nao required', () => {
      fixture.componentRef.setInput('label', 'Nome');
      fixture.componentRef.setInput('required', false);
      fixture.componentRef.setInput('control', new FormControl(''));
      fixture.detectChanges();

      const asterisk = fixture.nativeElement.querySelector('span.text-red-500');
      expect(asterisk).toBeNull();
    });

    it('deve renderizar hint quando fornecido e sem erro', () => {
      const control = new FormControl('valid value');
      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('hint', 'Digite seu nome completo');
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector('small.text-gray-500');
      expect(hint).toBeTruthy();
      expect(hint.textContent).toContain('Digite seu nome completo');
    });

    it('nao deve renderizar hint quando ha erro', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('hint', 'Digite seu nome completo');
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector('small.text-gray-500');
      expect(hint).toBeNull();
    });
  });

  describe('exibicao de erros de validacao', () => {
    it('deve exibir erro required quando campo touched/dirty e vazio', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('label', 'Nome');
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('obrigatório');
    });

    it('deve exibir erro minlength', () => {
      const control = new FormControl('ab', Validators.minLength(5));
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('5 caracteres');
    });

    it('deve exibir erro email', () => {
      const control = new FormControl('invalid-email', Validators.email);
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('inválido');
    });

    it('nao deve exibir erro quando campo nao touched', () => {
      const control = new FormControl('', Validators.required);
      // Nao marca como touched

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeNull();
    });

    it('nao deve exibir erro quando campo valido', () => {
      const control = new FormControl('valid value', Validators.required);
      control.markAsTouched();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeNull();
    });
  });

  describe('erros de servidor (RFC 9457)', () => {
    it('deve exibir serverError quando aplicado ao control', () => {
      const control = new FormControl('valor');
      control.setErrors({serverError: 'Nome deve conter pelo menos nome e sobrenome'});
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('label', 'Nome');
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Nome deve conter pelo menos nome e sobrenome');
    });

    it('deve aplicar classe p-invalid quando serverError presente', () => {
      const control = new FormControl('valor');
      control.setErrors({serverError: 'Erro do servidor'});
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const inputWrapper = fixture.nativeElement.querySelector('.form-field-input');
      expect(inputWrapper.classList.contains('p-invalid')).toBe(true);
    });

    it('deve exibir serverError combinado com outros erros', () => {
      const control = new FormControl('', Validators.required);
      // Adiciona serverError preservando required
      control.setErrors({
        ...control.errors,
        serverError: 'Erro personalizado do backend'
      });
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      // Required tem prioridade no FormValidationService
      expect(errorMessage.textContent).toContain('obrigatório');
    });

    it('deve reagir a mudancas imperativas via setErrors', () => {
      const control = new FormControl('valor valido');
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      // Inicialmente sem erro
      let errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeNull();

      // Simula erro do servidor sendo aplicado
      control.setErrors({serverError: 'E-mail ja cadastrado no sistema'});
      fixture.detectChanges();

      // Agora deve exibir o erro
      errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('E-mail ja cadastrado no sistema');
    });

    it('deve remover erro quando serverError limpo', () => {
      const control = new FormControl('valor');
      control.setErrors({serverError: 'Erro temporario'});
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      // Verifica que erro esta visivel
      let errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeTruthy();

      // Limpa o erro
      control.setErrors(null);
      fixture.detectChanges();

      // Erro deve desaparecer
      errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeNull();
    });
  });

  describe('classe p-invalid', () => {
    it('deve aplicar p-invalid quando control invalido e dirty', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();
      control.markAsDirty();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const inputWrapper = fixture.nativeElement.querySelector('.form-field-input');
      expect(inputWrapper.classList.contains('p-invalid')).toBe(true);
    });

    it('nao deve aplicar p-invalid quando control valido', () => {
      const control = new FormControl('valid', Validators.required);
      control.markAsTouched();

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const inputWrapper = fixture.nativeElement.querySelector('.form-field-input');
      expect(inputWrapper.classList.contains('p-invalid')).toBe(false);
    });

    it('nao deve aplicar p-invalid quando control nao touched', () => {
      const control = new FormControl('', Validators.required);
      // Nao marca como touched

      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const inputWrapper = fixture.nativeElement.querySelector('.form-field-input');
      expect(inputWrapper.classList.contains('p-invalid')).toBe(false);
    });
  });

  describe('casos de borda', () => {
    it('deve funcionar com control null', () => {
      fixture.componentRef.setInput('control', null);
      fixture.componentRef.setInput('label', 'Campo');
      fixture.detectChanges();

      expect(component).toBeTruthy();
      const errorMessage = fixture.nativeElement.querySelector('small.text-red-500');
      expect(errorMessage).toBeNull();
    });

    it('deve funcionar sem inputs definidos', () => {
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('deve aplicar fieldId ao label', () => {
      fixture.componentRef.setInput('label', 'Nome');
      fixture.componentRef.setInput('fieldId', 'nome-field');
      fixture.componentRef.setInput('control', new FormControl(''));
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label');
      expect(label.getAttribute('for')).toBe('nome-field');
    });
  });
});
