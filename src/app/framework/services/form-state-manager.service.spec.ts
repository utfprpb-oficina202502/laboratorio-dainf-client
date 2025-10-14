import {TestBed} from '@angular/core/testing';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {FormStateManagerService} from './form-state-manager.service';

describe('FormStateManagerService', () => {
  let service: FormStateManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormStateManagerService]
    });

    service = TestBed.inject(FormStateManagerService);
  });

  describe('patchFormWithObject', () => {
    it('não deve fazer nada quando formGroup é null', () => {
      const user = {name: 'John', email: 'john@test.com'};

      expect(() => service.patchFormWithObject(null, user)).not.toThrow();
    });

    it('não deve fazer nada quando formGroup é undefined', () => {
      const user = {name: 'John', email: 'john@test.com'};

      expect(() => service.patchFormWithObject(undefined, user)).not.toThrow();
    });

    it('não deve fazer nada quando object é null', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl('')
      });

      expect(() => service.patchFormWithObject(form, null)).not.toThrow();
      expect(form.value).toEqual({name: '', email: ''});
    });

    it('não deve fazer nada quando object é undefined', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl('')
      });

      expect(() => service.patchFormWithObject(form, undefined)).not.toThrow();
      expect(form.value).toEqual({name: '', email: ''});
    });

    it('deve atualizar formulário com dados do objeto', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl(''),
        age: new FormControl(0)
      });

      const user = {name: 'John', email: 'john@test.com', age: 30};

      service.patchFormWithObject(form, user);

      expect(form.value).toEqual(user);
    });

    it('deve atualizar apenas campos presentes no objeto', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl('initial@test.com'),
        age: new FormControl(0)
      });

      const partialUser = {name: 'John', age: 30};

      service.patchFormWithObject(form, partialUser);

      expect(form.value).toEqual({
        name: 'John',
        email: 'initial@test.com', // Não foi alterado
        age: 30
      });
    });

    it('deve funcionar com objetos complexos', () => {
      const form = new FormGroup({
        user: new FormGroup({
          name: new FormControl(''),
          email: new FormControl('')
        }),
        address: new FormGroup({
          street: new FormControl(''),
          city: new FormControl('')
        })
      });

      const data = {
        user: {name: 'John', email: 'john@test.com'},
        address: {street: '123 Main St', city: 'Springfield'}
      };

      service.patchFormWithObject(form, data);

      expect(form.value).toEqual(data);
    });
  });

  describe('prepareFormValue', () => {
    it('deve retornar o mesmo objeto quando removeEmpty é false', () => {
      const formValue = {name: 'John', email: '', age: null, city: undefined};

      const result = service.prepareFormValue(formValue, false);

      expect(result).toEqual(formValue);
    });

    it('deve remover strings vazias quando removeEmpty é true', () => {
      const formValue = {name: 'John', email: '', phone: ''};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John'});
    });

    it('deve remover valores null quando removeEmpty é true', () => {
      const formValue = {name: 'John', age: null, city: null};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John'});
    });

    it('deve remover valores undefined quando removeEmpty é true', () => {
      const formValue = {name: 'John', email: undefined, phone: undefined};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John'});
    });

    it('deve manter número 0 quando removeEmpty é true', () => {
      const formValue = {name: 'John', age: 0, score: 0};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John', age: 0, score: 0});
    });

    it('deve manter booleano false quando removeEmpty é true', () => {
      const formValue = {name: 'John', active: false, verified: false};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John', active: false, verified: false});
    });

    it('deve manter arrays vazios quando removeEmpty é true', () => {
      const formValue = {name: 'John', tags: [], items: []};

      const result = service.prepareFormValue(formValue, true);

      expect(result).toEqual({name: 'John', tags: [], items: []});
    });

    it('deve usar removeEmpty=true como padrão', () => {
      const formValue = {name: 'John', email: '', age: null};

      const result = service.prepareFormValue(formValue);

      expect(result).toEqual({name: 'John'});
    });
  });

  describe('mergeWithObject', () => {
    it('deve retornar formValue quando currentObject é null', () => {
      const formValue = {name: 'John', email: 'john@test.com'};

      const result = service.mergeWithObject(formValue, null as any);

      expect(result).toEqual(formValue);
    });

    it('deve retornar formValue quando currentObject é undefined', () => {
      const formValue = {name: 'John', email: 'john@test.com'};

      const result = service.mergeWithObject(formValue, undefined as any);

      expect(result).toEqual(formValue);
    });

    it('deve mesclar valores do formulário com objeto atual', () => {
      const currentUser = {id: 1, name: 'John', email: 'john@test.com', createdAt: '2024-01-01'};
      const formValue = {name: 'John Doe', email: 'john.doe@test.com'};

      const result = service.mergeWithObject(formValue, currentUser);

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@test.com',
        createdAt: '2024-01-01'
      });
    });

    it('deve sobrescrever valores do objeto atual com valores do formulário', () => {
      const currentObject = {name: 'John', age: 30, city: 'Springfield'};
      const formValue = {name: 'John Doe', age: 31};

      const result = service.mergeWithObject(formValue, currentObject);

      expect(result).toEqual({
        name: 'John Doe',
        age: 31,
        city: 'Springfield'
      });
    });

    it('deve manter campos do objeto atual que não estão no formulário', () => {
      const currentObject = {
        id: 1,
        name: 'John',
        email: 'john@test.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      };
      const formValue = {name: 'John Doe'};

      const result = service.mergeWithObject(formValue, currentObject);

      expect(result.id).toBe(1);
      expect(result.createdAt).toBe('2024-01-01');
      expect(result.updatedAt).toBe('2024-01-15');
      expect(result.email).toBe('john@test.com');
      expect(result.name).toBe('John Doe');
    });
  });

  describe('resetForm', () => {
    it('não deve fazer nada quando formGroup é null', () => {
      expect(() => service.resetForm(null)).not.toThrow();
    });

    it('não deve fazer nada quando formGroup é undefined', () => {
      expect(() => service.resetForm(undefined)).not.toThrow();
    });

    it('deve limpar todos os valores do formulário', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com'),
        age: new FormControl(30)
      });

      service.resetForm(form);

      expect(form.value).toEqual({name: null, email: null, age: null});
    });

    it('deve limpar estado touched dos controles', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      form.get('name')?.markAsTouched();
      form.get('email')?.markAsTouched();

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('email')?.touched).toBe(true);

      service.resetForm(form);

      expect(form.get('name')?.touched).toBe(false);
      expect(form.get('email')?.touched).toBe(false);
    });

    it('deve limpar estado dirty dos controles', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      form.get('name')?.markAsDirty();
      form.get('email')?.markAsDirty();

      expect(form.get('name')?.dirty).toBe(true);
      expect(form.get('email')?.dirty).toBe(true);

      service.resetForm(form);

      expect(form.get('name')?.dirty).toBe(false);
      expect(form.get('email')?.dirty).toBe(false);
    });

    it('deve resetar para valores padrão quando fornecidos', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com'),
        country: new FormControl(''),
        status: new FormControl('')
      });

      const defaultValues = {
        country: 'Brasil',
        status: 'active'
      };

      service.resetForm(form, defaultValues);

      expect(form.value).toEqual({
        name: null,
        email: null,
        country: 'Brasil',
        status: 'active'
      });
    });
  });

  describe('hasUnsavedChanges', () => {
    it('deve retornar false quando formGroup é null', () => {
      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.hasUnsavedChanges(null, originalUser);

      expect(result).toBe(false);
    });

    it('deve retornar false quando formGroup é undefined', () => {
      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.hasUnsavedChanges(undefined, originalUser);

      expect(result).toBe(false);
    });

    it('deve retornar false quando originalObject é null', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      const result = service.hasUnsavedChanges(form, null);

      expect(result).toBe(false);
    });

    it('deve retornar false quando originalObject é undefined', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      const result = service.hasUnsavedChanges(form, undefined);

      expect(result).toBe(false);
    });

    it('deve retornar false quando não há mudanças', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com'),
        age: new FormControl(30)
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30};

      const result = service.hasUnsavedChanges(form, originalUser);

      expect(result).toBe(false);
    });

    it('deve retornar true quando há mudanças em um campo', () => {
      const form = new FormGroup({
        name: new FormControl('John Doe'), // Alterado
        email: new FormControl('john@test.com'),
        age: new FormControl(30)
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30};

      const result = service.hasUnsavedChanges(form, originalUser);

      expect(result).toBe(true);
    });

    it('deve retornar true quando há mudanças em múltiplos campos', () => {
      const form = new FormGroup({
        name: new FormControl('John Doe'), // Alterado
        email: new FormControl('john.doe@test.com'), // Alterado
        age: new FormControl(31) // Alterado
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30};

      const result = service.hasUnsavedChanges(form, originalUser);

      expect(result).toBe(true);
    });

    it('deve detectar mudança de valor para string vazia', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl('john@test.com')
      });

      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.hasUnsavedChanges(form, originalUser);

      expect(result).toBe(true);
    });
  });

  describe('cloneFormValue', () => {
    it('deve retornar null quando formGroup é null', () => {
      const result = service.cloneFormValue(null);

      expect(result).toBeNull();
    });

    it('deve retornar null quando formGroup é undefined', () => {
      const result = service.cloneFormValue(undefined);

      expect(result).toBeNull();
    });

    it('deve clonar valores do formulário', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com'),
        age: new FormControl(30)
      });

      const cloned = service.cloneFormValue(form);

      expect(cloned).toEqual({name: 'John', email: 'john@test.com', age: 30});
    });

    it('deve criar cópia independente dos valores', () => {
      const form = new FormGroup({
        user: new FormGroup({
          name: new FormControl('John'),
          email: new FormControl('john@test.com')
        })
      });

      const cloned = service.cloneFormValue<{ user: { name: string; email: string } }>(form);

      // Alterar o clone não deve afetar o formulário
      if (cloned && cloned.user) {
        cloned.user.name = 'John Doe';
      }

      expect(form.value.user?.name).toBe('John');
      expect(cloned?.user.name).toBe('John Doe');
    });

    it('deve funcionar com arrays', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        tags: new FormControl(['javascript', 'typescript'])
      });

      const cloned = service.cloneFormValue<{ name: string; tags: string[] }>(form);

      // Alterar o clone não deve afetar o formulário
      if (cloned && cloned.tags) {
        cloned.tags.push('angular');
      }

      expect(form.value.tags?.length).toBe(2);
      expect(cloned?.tags.length).toBe(3);
    });
  });

  describe('getFormChanges', () => {
    it('deve retornar objeto vazio quando formGroup é null', () => {
      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.getFormChanges(null, originalUser);

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando formGroup é undefined', () => {
      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.getFormChanges(undefined, originalUser);

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando originalObject é null', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      const result = service.getFormChanges(form, null);

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando originalObject é undefined', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com')
      });

      const result = service.getFormChanges(form, undefined);

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando não há mudanças', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john@test.com'),
        age: new FormControl(30)
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30};

      const result = service.getFormChanges(form, originalUser);

      expect(result).toEqual({});
    });

    it('deve retornar apenas campos modificados', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        email: new FormControl('john.doe@test.com'), // Alterado
        age: new FormControl(30)
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30};

      const result = service.getFormChanges(form, originalUser);

      expect(result).toEqual({email: 'john.doe@test.com'});
    });

    it('deve retornar múltiplos campos modificados', () => {
      const form = new FormGroup({
        name: new FormControl('John Doe'), // Alterado
        email: new FormControl('john.doe@test.com'), // Alterado
        age: new FormControl(30),
        city: new FormControl('New York') // Alterado
      });

      const originalUser = {name: 'John', email: 'john@test.com', age: 30, city: 'Springfield'};

      const result = service.getFormChanges(form, originalUser);

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john.doe@test.com',
        city: 'New York'
      });
    });

    it('deve detectar mudança para string vazia', () => {
      const form = new FormGroup({
        name: new FormControl(''), // Alterado para vazio
        email: new FormControl('john@test.com')
      });

      const originalUser = {name: 'John', email: 'john@test.com'};

      const result = service.getFormChanges(form, originalUser);

      expect(result).toEqual({name: ''});
    });

    it('deve detectar mudança para null', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        age: new FormControl(null) // Alterado para null
      });

      const originalUser = {name: 'John', age: 30};

      const result = service.getFormChanges(form, originalUser);

      expect(result).toEqual({age: null});
    });
  });

  describe('testes de integração', () => {
    it('deve realizar fluxo completo de criação e edição', () => {
      // 1. Criar novo formulário
      const form = new FormGroup({
        id: new FormControl<number | null>(null),
        name: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        age: new FormControl(0)
      });

      // 2. Preencher formulário para novo registro
      form.patchValue({name: 'John', email: 'john@test.com', age: 30});

      // 3. Preparar valores e criar objeto
      const formValue = service.prepareFormValue(form.value);
      let user: any = service.mergeWithObject(formValue, null);

      expect(user).toEqual({name: 'John', email: 'john@test.com', age: 30});

      // 4. Simular retorno do backend com ID
      user = {...user, id: 1, createdAt: '2024-01-01'};

      // 5. Carregar usuário existente no formulário (edição)
      service.patchFormWithObject(form, user);

      expect(form.value.id).toBe(1);
      expect(form.value.name).toBe('John');

      // 6. Modificar alguns campos
      form.patchValue({name: 'John Doe', email: 'john.doe@test.com'});

      // 7. Verificar mudanças não salvas
      expect(service.hasUnsavedChanges(form, user)).toBe(true);

      // 8. Obter apenas campos modificados
      const changes = service.getFormChanges(form, user);

      expect(changes).toEqual({name: 'John Doe', email: 'john.doe@test.com'});

      // 9. Preparar valores e mesclar com objeto existente
      const updatedFormValue = service.prepareFormValue(form.value);
      const updatedUser = service.mergeWithObject(updatedFormValue, user);

      expect(updatedUser).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@test.com',
        age: 30,
        createdAt: '2024-01-01'
      });
    });

    it('deve gerenciar estado de formulário com reset e defaults', () => {
      const form = new FormGroup({
        name: new FormControl(''),
        email: new FormControl(''),
        country: new FormControl(''),
        status: new FormControl('')
      });

      const defaultValues = {
        country: 'Brasil',
        status: 'active'
      };

      // 1. Reset com valores padrão
      service.resetForm(form, defaultValues);

      expect(form.value).toEqual({
        name: null,
        email: null,
        country: 'Brasil',
        status: 'active'
      });

      // 2. Preencher formulário
      form.patchValue({name: 'John', email: 'john@test.com'});

      // 3. Clonar valores atuais
      const clonedValues = service.cloneFormValue(form);

      expect(clonedValues).toEqual({
        name: 'John',
        email: 'john@test.com',
        country: 'Brasil',
        status: 'active'
      });

      // 4. Verificar que não há mudanças em relação ao clone
      expect(service.hasUnsavedChanges(form, clonedValues)).toBe(false);

      // 5. Modificar formulário
      form.patchValue({name: 'John Doe'});

      // 6. Verificar que agora há mudanças
      expect(service.hasUnsavedChanges(form, clonedValues)).toBe(true);
    });
  });
});
