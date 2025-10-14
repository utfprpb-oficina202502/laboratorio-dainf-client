import {TestBed} from '@angular/core/testing';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {FormValidationService} from './form-validation.service';

describe('FormValidationService', () => {
  let service: FormValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormValidationService]
    });

    service = TestBed.inject(FormValidationService);
  });

  describe('getErrorMessage', () => {
    it('deve retornar string vazia quando control é null', () => {
      const result = service.getErrorMessage(null);

      expect(result).toBe('');
    });

    it('deve retornar string vazia quando control é undefined', () => {
      const result = service.getErrorMessage(undefined);

      expect(result).toBe('');
    });

    it('deve retornar string vazia quando control não tem erros', () => {
      const control = new FormControl('valid value');
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('');
    });

    it('deve retornar string vazia quando control não foi touched', () => {
      const control = new FormControl('', Validators.required);
      // Não marca como touched

      const result = service.getErrorMessage(control);

      expect(result).toBe('');
    });

    it('deve retornar mensagem para erro required', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Este campo é obrigatório');
    });

    it('deve retornar mensagem para erro minlength', () => {
      const control = new FormControl('abc', Validators.minLength(5));
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Mínimo de 5 caracteres');
    });

    it('deve retornar mensagem para erro maxlength', () => {
      const control = new FormControl('a'.repeat(20), Validators.maxLength(10));
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Máximo de 10 caracteres');
    });

    it('deve retornar mensagem para erro email', () => {
      const control = new FormControl('invalid-email', Validators.email);
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('E-mail inválido');
    });

    it('deve retornar mensagem para erro pattern', () => {
      const control = new FormControl('abc', Validators.pattern(/^\d+$/));
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Formato inválido');
    });

    it('deve retornar mensagem para erro min', () => {
      const control = new FormControl(5, Validators.min(10));
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Valor mínimo: 10');
    });

    it('deve retornar mensagem para erro max', () => {
      const control = new FormControl(100, Validators.max(50));
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Valor máximo: 50');
    });

    it('deve retornar mensagem genérica para erro customizado', () => {
      const control = new FormControl('value');
      control.setErrors({customError: true});
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Campo inválido');
    });

    it('deve priorizar required sobre outros erros', () => {
      const control = new FormControl('', [Validators.required, Validators.minLength(5)]);
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      expect(result).toBe('Este campo é obrigatório');
    });

    it('deve retornar primeira mensagem quando múltiplos erros (exceto required)', () => {
      const control = new FormControl('abc', [Validators.minLength(5), Validators.maxLength(2)]);
      control.markAsTouched();

      const result = service.getErrorMessage(control);

      // Como required tem prioridade no código, mas aqui não tem required,
      // minlength vem primeiro na ordem do código
      expect(result).toBe('Mínimo de 5 caracteres');
    });
  });

  describe('hasError', () => {
    it('deve retornar false quando control é null', () => {
      const result = service.hasError(null);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control é undefined', () => {
      const result = service.hasError(undefined);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control é válido', () => {
      const control = new FormControl('valid value');
      control.markAsTouched();

      const result = service.hasError(control);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control inválido mas não touched', () => {
      const control = new FormControl('', Validators.required);
      // Não marca como touched

      const result = service.hasError(control);

      expect(result).toBe(false);
    });

    it('deve retornar true quando control inválido e touched', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();

      const result = service.hasError(control);

      expect(result).toBe(true);
    });

    it('deve retornar false após corrigir erro', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();

      expect(service.hasError(control)).toBe(true);

      control.setValue('valid value');

      expect(service.hasError(control)).toBe(false);
    });
  });

  describe('isValidField', () => {
    it('deve retornar false quando control é null', () => {
      const result = service.isValidField(null);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control é undefined', () => {
      const result = service.isValidField(undefined);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control válido mas não touched', () => {
      const control = new FormControl('valid value');
      // Não marca como touched

      const result = service.isValidField(control);

      expect(result).toBe(false);
    });

    it('deve retornar false quando control inválido e touched', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();

      const result = service.isValidField(control);

      expect(result).toBe(false);
    });

    it('deve retornar true quando control válido e touched', () => {
      const control = new FormControl('valid value', Validators.required);
      control.markAsTouched();

      const result = service.isValidField(control);

      expect(result).toBe(true);
    });

    it('deve retornar true após corrigir campo inválido', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();

      expect(service.isValidField(control)).toBe(false);

      control.setValue('valid value');

      expect(service.isValidField(control)).toBe(true);
    });
  });

  describe('markFormAsTouched', () => {
    it('não deve fazer nada quando formGroup é null', () => {
      // Não deve lançar erro
      expect(() => service.markFormAsTouched(null as any)).not.toThrow();
    });

    it('deve marcar todos os controles como touched', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl(''),
        age: new FormControl('')
      });

      service.markFormAsTouched(form);

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('email')?.touched).toBe(true);
      expect(form.get('age')?.touched).toBe(true);
    });

    it('deve marcar FormGroups aninhados recursivamente', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        address: new FormGroup({
          street: new FormControl(''),
          city: new FormControl(''),
          country: new FormGroup({
            name: new FormControl(''),
            code: new FormControl('')
          })
        })
      });

      service.markFormAsTouched(form);

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('address.street')?.touched).toBe(true);
      expect(form.get('address.city')?.touched).toBe(true);
      expect(form.get('address.country.name')?.touched).toBe(true);
      expect(form.get('address.country.code')?.touched).toBe(true);
    });

    it('deve funcionar com FormGroup vazio', () => {
      const form = new FormGroup({});

      expect(() => service.markFormAsTouched(form)).not.toThrow();
    });

    it('deve ignorar controles null dentro do FormGroup', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        removed: new FormControl('')
      });

      // Simula um controle que foi removido
      jest.spyOn(form, 'get').mockImplementation((path: string | (string | number)[]) => {
        const key = typeof path === 'string' ? path : path.join('.');
        if (key === 'removed') return null;
        return form.controls[key as keyof typeof form.controls] || null;
      });

      expect(() => service.markFormAsTouched(form)).not.toThrow();
      expect(form.get('name')?.touched).toBe(true);
    });
  });

  describe('hasFormGroupErrors', () => {
    it('deve retornar false quando formGroup é null', () => {
      const result = service.hasFormGroupErrors(null);

      expect(result).toBe(false);
    });

    it('deve retornar false quando formGroup é undefined', () => {
      const result = service.hasFormGroupErrors(undefined);

      expect(result).toBe(false);
    });

    it('deve retornar false quando formGroup é válido', () => {
      const form = new FormGroup({
        name: new FormControl('John', Validators.required),
        email: new FormControl('john@test.com', Validators.email)
      });

      const result = service.hasFormGroupErrors(form);

      expect(result).toBe(false);
    });

    it('deve retornar true quando formGroup tem erros', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('invalid', Validators.email)
      });

      const result = service.hasFormGroupErrors(form);

      expect(result).toBe(true);
    });

    it('deve retornar true quando FormGroup aninhado tem erros', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        address: new FormGroup({
          street: new FormControl('', Validators.required)
        })
      });

      const result = service.hasFormGroupErrors(form);

      expect(result).toBe(true);
    });
  });

  describe('getAllErrors', () => {
    it('deve retornar objeto vazio quando formGroup é null', () => {
      const result = service.getAllErrors(null as any);

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando formGroup não tem erros', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      const result = service.getAllErrors(form);

      expect(result).toEqual({});
    });

    it('deve retornar todos os erros de controles', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('invalid', Validators.email)
      });

      const result = service.getAllErrors(form);

      expect(result).toEqual({
        name: {required: true},
        email: {email: true}
      });
    });

    it('deve retornar erros de FormGroups aninhados com path correto', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormGroup({
          street: new FormControl('', Validators.required),
          city: new FormControl('ab', Validators.minLength(3)) // String curta para gerar erro de minlength
        })
      });

      const result = service.getAllErrors(form);

      expect(result).toEqual({
        name: {required: true},
        'address.street': {required: true},
        'address.city': {minlength: expect.any(Object)}
      });
    });

    it('deve funcionar com FormGroups profundamente aninhados', () => {
      const form = new FormGroup({
        user: new FormGroup({
          profile: new FormGroup({
            name: new FormControl('', Validators.required)
          })
        })
      });

      const result = service.getAllErrors(form);

      expect(result).toEqual({
        'user.profile.name': {required: true}
      });
    });

    it('deve ignorar controles null dentro do FormGroup', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        removed: new FormControl('')
      });

      jest.spyOn(form, 'get').mockImplementation((path: string | (string | number)[]) => {
        const key = typeof path === 'string' ? path : path.join('.');
        if (key === 'removed') return null;
        return form.controls[key as keyof typeof form.controls] || null;
      });

      const result = service.getAllErrors(form);

      expect(result).toEqual({
        name: {required: true}
      });
    });
  });

  describe('clearErrors', () => {
    it('não deve fazer nada quando formGroup é null', () => {
      expect(() => service.clearErrors(null as any)).not.toThrow();
    });

    it('deve limpar erros de todos os controles', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('invalid', Validators.email)
      });

      // Verifica que tem erros
      expect(form.get('name')?.errors).toBeTruthy();
      expect(form.get('email')?.errors).toBeTruthy();

      service.clearErrors(form);

      // Verifica que erros foram limpos
      expect(form.get('name')?.errors).toBeNull();
      expect(form.get('email')?.errors).toBeNull();
    });

    it('deve limpar erros de FormGroups aninhados recursivamente', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormGroup({
          street: new FormControl('', Validators.required),
          city: new FormControl('ab', Validators.minLength(3)) // String curta para gerar erro de minlength
        })
      });

      // Verifica que tem erros
      expect(form.get('name')?.errors).toBeTruthy();
      expect(form.get('address.street')?.errors).toBeTruthy();
      expect(form.get('address.city')?.errors).toBeTruthy();

      service.clearErrors(form);

      // Verifica que todos os erros foram limpos
      expect(form.get('name')?.errors).toBeNull();
      expect(form.get('address.street')?.errors).toBeNull();
      expect(form.get('address.city')?.errors).toBeNull();
    });

    it('deve funcionar com FormGroup sem erros', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      expect(() => service.clearErrors(form)).not.toThrow();
    });

    it('deve ignorar controles null dentro do FormGroup', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        removed: new FormControl('')
      });

      jest.spyOn(form, 'get').mockImplementation((path: string | (string | number)[]) => {
        const key = typeof path === 'string' ? path : path.join('.');
        if (key === 'removed') return null;
        return form.controls[key as keyof typeof form.controls] || null;
      });

      expect(() => service.clearErrors(form)).not.toThrow();
    });
  });

  describe('testes de integração', () => {
    it('deve realizar fluxo completo de validação de formulário', () => {
      const form = new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        age: new FormControl('', [Validators.required, Validators.min(18)])
      });

      // 1. Verificar que não tem erros visíveis inicialmente (não touched)
      expect(service.hasError(form.get('name'))).toBe(false);
      expect(service.getErrorMessage(form.get('name'))).toBe('');

      // 2. Marcar como touched (simula tentativa de submit)
      service.markFormAsTouched(form);

      // 3. Verificar que agora tem erros visíveis
      expect(service.hasError(form.get('name'))).toBe(true);
      expect(service.getErrorMessage(form.get('name'))).toBe('Este campo é obrigatório');

      // 4. Preencher campos corretamente
      form.patchValue({
        name: 'John',
        email: 'john@test.com',
        age: '25'
      });

      // 5. Verificar que campos agora são válidos
      expect(service.isValidField(form.get('name'))).toBe(true);
      expect(service.hasError(form.get('name'))).toBe(false);
      expect(service.hasFormGroupErrors(form)).toBe(false);
    });

    it('deve validar formulário com campos aninhados', () => {
      const form = new FormGroup({
        user: new FormGroup({
          name: new FormControl('', Validators.required),
          contact: new FormGroup({
            email: new FormControl('', [Validators.required, Validators.email]), // Adicionar required para gerar erro
            phone: new FormControl('', Validators.required)
          })
        })
      });

      // Obter todos os erros
      const errors = service.getAllErrors(form);
      expect(Object.keys(errors).length).toBe(3); // name, email, phone

      // Marcar como touched
      service.markFormAsTouched(form);

      // Verificar erros específicos
      expect(service.hasError(form.get('user.name'))).toBe(true);
      expect(service.getErrorMessage(form.get('user.contact.phone'))).toBe('Este campo é obrigatório');

      // Corrigir erros
      form.patchValue({
        user: {
          name: 'John',
          contact: {
            email: 'john@test.com',
            phone: '123456789'
          }
        }
      });

      // Verificar que todos os campos agora são válidos
      expect(service.hasFormGroupErrors(form)).toBe(false);
      expect(service.getAllErrors(form)).toEqual({});
    });
  });
});
