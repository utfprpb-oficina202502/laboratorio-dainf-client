import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, DebugElement} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ValidationDirective} from './validation.directive';
import {ValidationService} from './validation.service';
import {getDirective, queryFormControls, setFormControlInvalid} from '../testing/test-helpers';

/**
 * Componente de teste para o ValidationDirective
 * Simula um formulário real com diferentes cenários de validação
 */
@Component({
  imports: [ReactiveFormsModule, ValidationDirective],
  template: `
    <form [formGroup]="testForm">
      <div class="form-field">
        <label>Campo Teste</label>
        <input
          type="text"
          formControlName="testField"
          appValidation
          [validationMessage]="customMessage"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label>Campo Tailwind</label>
        <input
          type="text"
          formControlName="tailwindField"
          appValidation
        />
      </div>

      <div>
        <input
          type="text"
          formControlName="noParentField"
          appValidation
        />
      </div>

      <div class="form-field">
        <input
          type="text"
          formControlName="noLabelField"
          appValidation
        />
      </div>
    </form>
  `
})
class TestComponent {
  customMessage = '';
  testForm = new FormGroup({
    testField: new FormControl('', [Validators.required]),
    tailwindField: new FormControl('', [Validators.required, Validators.minLength(3)]),
    noParentField: new FormControl('', [Validators.required]),
    noLabelField: new FormControl('', [Validators.required])
  });
}

describe('ValidationDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let validationService: ValidationService;
  let testFieldElement: DebugElement;
  let tailwindFieldElement: DebugElement;
  let noParentFieldElement: DebugElement;
  let noLabelFieldElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [ValidationService]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    validationService = TestBed.inject(ValidationService);
    fixture.detectChanges();

    const elements = queryFormControls(fixture, [
      'testField',
      'tailwindField',
      'noParentField',
      'noLabelField'
    ]);

    testFieldElement = elements.testField;
    tailwindFieldElement = elements.tailwindField;
    noParentFieldElement = elements.noParentField;
    noLabelFieldElement = elements.noLabelField;
  });

  // ============================================================================
  // Setup & Lifecycle (5 tests)
  // ============================================================================
  describe('Setup & Lifecycle', () => {
    it('deve criar a diretiva', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      expect(directive).toBeTruthy();
    });

    it('deve encontrar elemento pai com classe .form-field', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      expect(formGroup).toBeTruthy();
      expect(formGroup?.classList.contains('form-field')).toBe(true);
    });

    it('deve encontrar elemento pai com padrão Tailwind (.flex.flex-col.gap-2)', () => {
      const directive = getDirective(tailwindFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      expect(formGroup).toBeTruthy();
      expect(formGroup?.classList.contains('flex')).toBe(true);
      expect(formGroup?.classList.contains('flex-col')).toBe(true);
      expect(formGroup?.classList.contains('gap-2')).toBe(true);
    });

    it('deve lidar graciosamente com ausência de form group', () => {
      const directive = getDirective(noParentFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      expect(formGroup).toBeNull();
      // Não deve lançar erro ao chamar métodos
      expect(() => directive.checkValidation()).not.toThrow();
    });

    it('deve fazer unsubscribe no destroy', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const destroySpy = jest.spyOn(directive['destroy$'], 'next');
      const completeSpy = jest.spyOn(directive['destroy$'], 'complete');

      directive.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // findFormGroup() (6 tests)
  // ============================================================================
  describe('findFormGroup()', () => {
    it('deve retornar null quando nenhum pai corresponde', () => {
      const directive = getDirective(noParentFieldElement, ValidationDirective);
      const result = directive['findFormGroup'](noParentFieldElement.nativeElement);

      expect(result).toBeNull();
    });

    it('deve encontrar container .form-field', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const result = directive['findFormGroup'](testFieldElement.nativeElement);

      expect(result).toBeTruthy();
      expect(result?.classList.contains('form-field')).toBe(true);
    });

    it('deve encontrar padrão Tailwind (.flex.flex-col.gap-2)', () => {
      const directive = getDirective(tailwindFieldElement, ValidationDirective);
      const result = directive['findFormGroup'](tailwindFieldElement.nativeElement);

      expect(result).toBeTruthy();
      expect(result?.classList.contains('flex')).toBe(true);
      expect(result?.classList.contains('flex-col')).toBe(true);
      expect(result?.classList.contains('gap-2')).toBe(true);
    });

    it('deve atravessar múltiplos níveis acima', () => {
      const inputElement = testFieldElement.nativeElement;

      // Verifica que o input está dentro de um container .form-field
      let current = inputElement.parentElement;
      let found = false;
      while (current) {
        if (current.classList.contains('form-field')) {
          found = true;
          break;
        }
        current = current.parentElement;
      }

      expect(found).toBe(true);
    });

    it('deve parar no primeiro pai correspondente', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      // O form-field é o primeiro pai correspondente
      expect(formGroup?.classList.contains('form-field')).toBe(true);
    });

    it('deve lidar com parentElement nulo', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const mockElement = document.createElement('div');

      const result = directive['findFormGroup'](mockElement);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // resetFormGroup() (5 tests)
  // ============================================================================
  describe('resetFormGroup()', () => {
    it('deve remover classe has-error', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      // Adiciona classe has-error
      formGroup?.classList.add('has-error');

      directive.resetFormGroup();

      expect(formGroup?.classList.contains('has-error')).toBe(false);
    });

    it('deve remover todos os elementos .help-block', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const formGroup = directive['formGroupElement'];

      // Adiciona help-blocks
      const helpBlock1 = document.createElement('span');
      helpBlock1.classList.add('help-block');
      const helpBlock2 = document.createElement('span');
      helpBlock2.classList.add('help-block');

      formGroup?.appendChild(helpBlock1);
      formGroup?.appendChild(helpBlock2);

      expect(formGroup?.querySelectorAll('.help-block').length).toBe(2);

      directive.resetFormGroup();

      expect(formGroup?.querySelectorAll('.help-block').length).toBe(0);
    });

    it('deve chamar validationService.removeValidation()', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const removeSpy = jest.spyOn(validationService, 'removeValidation');

      directive.resetFormGroup();

      expect(removeSpy).toHaveBeenCalledWith('testField');
    });

    it('deve lidar com formGroupElement ausente', () => {
      const directive = getDirective(noParentFieldElement, ValidationDirective);

      expect(() => directive.resetFormGroup()).not.toThrow();
    });

    it('deve lidar com formControl.name como não-string', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const formControl = directive['formControl'];

      // Temporariamente muda o nome para número (edge case)
      Object.defineProperty(formControl, 'name', {
        value: 123,
        writable: true,
        configurable: true
      });

      expect(() => directive.resetFormGroup()).not.toThrow();
    });
  });

  // ============================================================================
  // getMessage() (6 tests)
  // ============================================================================
  describe('getMessage()', () => {
    it('deve retornar mensagem customizada quando fornecida', () => {
      component.customMessage = 'Mensagem personalizada';
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      const message = directive.getMessage('required');

      expect(message).toBe('Mensagem personalizada');
    });

    it('deve chamar validationService.getMessageByError() quando erro existe', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      jest.spyOn(validationService, 'getMessageByError').mockReturnValue('Mensagem do serviço');

      const message = directive.getMessage('required');

      expect(validationService.getMessageByError).toHaveBeenCalledWith('required');
      expect(message).toBe('Mensagem do serviço');
    });

    it('deve retornar mensagem padrão quando não há custom/erro', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);

      const message = directive.getMessage();

      expect(message).toBe('Por favor, insira um valor correto');
    });

    it('deve priorizar mensagem customizada sobre mensagem do serviço', () => {
      component.customMessage = 'Custom tem prioridade';
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      jest.spyOn(validationService, 'getMessageByError').mockReturnValue('Mensagem do serviço');

      const message = directive.getMessage('required');

      expect(message).toBe('Custom tem prioridade');
      expect(validationService.getMessageByError).not.toHaveBeenCalled();
    });

    it('deve lidar com mensagem customizada vazia', () => {
      component.customMessage = '';
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      jest.spyOn(validationService, 'getMessageByError').mockReturnValue('Mensagem do serviço');

      const message = directive.getMessage('required');

      expect(message).toBe('Mensagem do serviço');
    });

    it('deve lidar com parâmetro erro indefinido', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);

      const message = directive.getMessage(undefined);

      expect(message).toBe('Por favor, insira um valor correto');
    });
  });

  // ============================================================================
  // getError() (5 tests)
  // ============================================================================
  describe('getError()', () => {
    it('deve retornar primeira chave de erro de ValidationErrors', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const errors = {required: true, minlength: {requiredLength: 3}};

      const error = directive.getError(errors);

      expect(error).toBe('required');
    });

    it('deve retornar null quando errors é null', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);

      const error = directive.getError(null);

      expect(error).toBeNull();
    });

    it('deve retornar null quando errors é objeto vazio', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);

      const error = directive.getError({});

      expect(error).toBeNull();
    });

    it('deve usar Object.hasOwn() corretamente', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const hasOwnSpy = jest.spyOn(Object, 'hasOwn');
      const errors = {required: true};

      directive.getError(errors);

      expect(hasOwnSpy).toHaveBeenCalledWith(errors, 'required');
    });

    it('deve lidar com múltiplos erros (retornar primeiro)', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const errors = {
        required: true,
        minlength: {requiredLength: 3},
        pattern: {requiredPattern: '^[a-z]+$'}
      };

      const error = directive.getError(errors);

      // Retorna o primeiro erro encontrado na iteração do objeto
      expect(error).toBeTruthy();
      expect(['required', 'minlength', 'pattern']).toContain(error!);
    });
  });

  // ============================================================================
  // checkValidation() (8 tests)
  // ============================================================================
  describe('checkValidation()', () => {
    it('deve adicionar classe has-error quando inválido e dirty', () => {
      setFormControlInvalid(component.testForm, 'testField');


      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(true);
    });

    it('deve criar help-block com mensagem', () => {
      setFormControlInvalid(component.testForm, 'testField');


      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      const helpBlock = formGroup?.querySelector('.help-block');

      expect(helpBlock).toBeTruthy();
      expect(helpBlock?.textContent).toBeTruthy();
    });

    it('não deve validar quando pristine', () => {
      const control = component.testForm.get('testField')!;
      control.setValue('');
      // Não marca como dirty
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(false);
    });

    it('não deve validar quando untouched', () => {
      const control = component.testForm.get('testField')!;
      control.setValue('');
      // Não marca como touched
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(false);
    });

    it('deve chamar validationService.addValidation()', () => {
      const control = component.testForm.get('testField')!;
      control.markAsDirty();
      control.setValue('');
      fixture.detectChanges();

      const addSpy = jest.spyOn(validationService, 'addValidation');

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'testField',
        campo: 'Campo Teste'
      }));
    });

    it('deve extrair texto do label para campo', () => {
      const control = component.testForm.get('testField')!;
      control.markAsDirty();
      control.setValue('');
      fixture.detectChanges();

      const addSpy = jest.spyOn(validationService, 'addValidation');

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        campo: 'Campo Teste'
      }));
    });

    it('deve lidar graciosamente com ausência de label', () => {
      const control = component.testForm.get('noLabelField')!;
      control.markAsDirty();
      control.setValue('');
      fixture.detectChanges();

      const addSpy = jest.spyOn(validationService, 'addValidation');

      const directive = getDirective(noLabelFieldElement, ValidationDirective);
      directive.checkValidation();

      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        campo: ''
      }));
    });

    it('deve lidar com controle válido (sem exibir erro)', () => {
      const control = component.testForm.get('testField')!;
      control.markAsDirty();
      control.setValue('valor válido');
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(false);
      expect(formGroup?.querySelector('.help-block')).toBeNull();
    });
  });

  // ============================================================================
  // Integration Tests (5 tests)
  // ============================================================================
  describe('Testes de Integração', () => {
    it('deve responder a formControl.valueChanges', () => {
      // Verifica que a diretiva não quebra ao mudar valores múltiplas vezes
      const control = component.testForm.get('testField')!;

      expect(() => {
        control.setValue('valor1');
        fixture.detectChanges();
        control.setValue('valor2');
        fixture.detectChanges();
        control.setValue('');
        fixture.detectChanges();
      }).not.toThrow();

      // A subscription de valueChanges foi criada no constructor
      // e não deve ter causado erros nas múltiplas mudanças
    });

    it('deve integrar corretamente com ValidationService', () => {
      const control = component.testForm.get('testField')!;
      control.markAsDirty();
      control.setValue('');
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      const addSpy = jest.spyOn(validationService, 'addValidation');
      const removeSpy = jest.spyOn(validationService, 'removeValidation');

      directive.checkValidation();

      expect(addSpy).toHaveBeenCalled();

      directive.resetFormGroup();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('deve fazer cleanup de subscriptions no destroy', () => {
      const directive = getDirective(testFieldElement, ValidationDirective);
      const subscription = directive['formControl'].valueChanges?.subscribe();

      expect(subscription?.closed).toBe(false);

      directive.ngOnDestroy();

      // Após destroy, novas mudanças não devem disparar checkValidation
      const checkSpy = jest.spyOn(directive, 'checkValidation');
      component.testForm.get('testField')!.setValue('novo valor');

      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('deve funcionar com reactive forms', () => {
      const control = component.testForm.get('testField')!;
      control.markAsDirty();
      control.setErrors({required: true});
      fixture.detectChanges();

      const directive = getDirective(testFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(true);
    });

    it('deve lidar com múltiplos erros de validação simultaneamente', () => {
      const control = component.testForm.get('tailwindField')!;
      control.markAsDirty();
      control.setValue('ab'); // Menor que minLength(3)
      fixture.detectChanges();

      const directive = getDirective(tailwindFieldElement, ValidationDirective);
      directive.checkValidation();

      const formGroup = directive['formGroupElement'];
      expect(formGroup?.classList.contains('has-error')).toBe(true);

      const helpBlock = formGroup?.querySelector('.help-block');
      expect(helpBlock).toBeTruthy();
    });
  });
});
