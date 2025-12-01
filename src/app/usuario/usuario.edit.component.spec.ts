import {TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {of} from 'rxjs';
import {UsuarioEditComponent} from './usuario.edit.component';
import {UsuarioService} from './usuario.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoggerService} from '../framework/services/logger.service';
import {StorageService} from '../framework/services/storage.service';
import {LoginService} from '../login/login.service';
import {FormValidationService} from '../framework/services/form-validation.service';
import {FormStateManagerService} from '../framework/services/form-state-manager.service';
import {FormBusinessRulesService} from '../framework/services/form-business-rules.service';
import {ErrorHandlerService} from '../framework/services/error-handler.service';
import {PermissaoTestFactory, UsuarioTestFactory} from './usuario.test-factory';

describe('UsuarioEditComponent', () => {
  let component: any; // Usando any para acessar membros protected nos testes
  let fixture: any;

  beforeEach(() => {
    const usuarioServiceMock = {
      findAllPermissao: jest.fn().mockReturnValue(of(PermissaoTestFactory.createAll())),
      updateUser: jest.fn().mockReturnValue(of(UsuarioTestFactory.create())),
      changeSenha: jest.fn().mockReturnValue(of({})),
      findById: jest.fn().mockReturnValue(of(UsuarioTestFactory.create()))
    };

    const storageServiceMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(UsuarioTestFactory.create())),
      setItem: jest.fn()
    };

    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockReturnValue(of(null))
    };

    const activatedRouteMock = {
      params: of({id: '1'})
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, UsuarioEditComponent],
      providers: [
        provideRouter([]),
        FormBuilder,
        MessageService,
        {provide: UsuarioService, useValue: usuarioServiceMock},
        {provide: LoaderService, useValue: {show: jest.fn(), hide: jest.fn()}},
        {provide: LoggerService, useValue: {error: jest.fn(), warn: jest.fn()}},
        {provide: StorageService, useValue: storageServiceMock},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: ActivatedRoute, useValue: activatedRouteMock},
        {
          provide: FormValidationService,
          useValue: {getErrorMessage: jest.fn(), markAllAsTouched: jest.fn()}
        },
        {provide: FormStateManagerService, useValue: {patchForm: jest.fn(), resetForm: jest.fn()}},
        {provide: FormBusinessRulesService, useValue: {}},
        {provide: ErrorHandlerService, useValue: {handleError: jest.fn()}}
      ]
    });

    fixture = TestBed.createComponent(UsuarioEditComponent);
    component = fixture.componentInstance;
  });

  describe('buildForm', () => {
    it('deve criar formulário com campos corretos', () => {
      const form = component.buildForm();

      expect(form.get('id')).toBeTruthy();
      expect(form.get('nome')).toBeTruthy();
      expect(form.get('email')).toBeTruthy();
      expect(form.get('telefone')).toBeTruthy();
      expect(form.get('documento')).toBeTruthy();
      expect(form.get('permissoes')).toBeTruthy();
    });

    it('deve ter campo id desabilitado', () => {
      const form = component.buildForm();

      expect(form.get('id')?.disabled).toBe(true);
    });

    it('deve ter campo email desabilitado', () => {
      const form = component.buildForm();

      expect(form.get('email')?.disabled).toBe(true);
    });

    it('deve ter campo permissoes desabilitado', () => {
      const form = component.buildForm();

      expect(form.get('permissoes')?.disabled).toBe(true);
    });

    it('deve ter campo nome habilitado para edição', () => {
      const form = component.buildForm();

      expect(form.get('nome')?.disabled).toBe(false);
    });

    it('deve ter validadores required em campos obrigatórios', () => {
      const form = component.buildForm();

      form.get('nome')?.setValue('');
      form.get('telefone')?.setValue('');
      form.get('documento')?.setValue('');

      expect(form.get('nome')?.errors?.['required']).toBe(true);
      expect(form.get('telefone')?.errors?.['required']).toBe(true);
      expect(form.get('documento')?.errors?.['required']).toBe(true);
    });

    it('deve validar minLength do nome', () => {
      const form = component.buildForm();

      form.get('nome')?.setValue('AB');

      expect(form.get('nome')?.errors?.['minlength']).toBeTruthy();
    });
  });

  describe('prepareFormValue', () => {
    it('deve adicionar username igual ao email para retrocompatibilidade', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        id: 1,
        nome: 'Teste',
        email: 'teste@email.com',
        telefone: '41999999999',
        documento: '123456',
        permissoes: []
      });

      const result = component.prepareFormValue({});

      expect(result.username).toBe('teste@email.com');
    });

    it('deve incluir campos do formulário mesmo quando desabilitados', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        id: 5,
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        telefone: '41888888888',
        documento: 'DOC123',
        permissoes: [PermissaoTestFactory.createAluno()]
      });

      const result = component.prepareFormValue({});

      expect(result.id).toBe(5);
      expect(result.nome).toBe('Usuário Teste');
      expect(result.email).toBe('usuario@teste.com');
      expect(result.username).toBe('usuario@teste.com');
    });

    it('deve retornar formValue original se form não existe', () => {
      component.form.set(null);

      const formValue = {nome: 'Teste'};
      const result = component.prepareFormValue(formValue);

      expect(result).toEqual(formValue);
    });
  });

  describe('documentLabel', () => {
    it('deve retornar RA quando usuário é aluno', () => {
      const aluno = UsuarioTestFactory.createAluno();
      component.object.set(aluno);

      expect(component.documentLabel()).toBe('RA');
    });

    it('deve retornar SIAPE quando usuário é professor', () => {
      const professor = UsuarioTestFactory.createProfessor();
      component.object.set(professor);

      expect(component.documentLabel()).toBe('SIAPE');
    });

    it('deve retornar SIAPE quando usuário é administrador', () => {
      const admin = UsuarioTestFactory.createAdmin();
      component.object.set(admin);

      expect(component.documentLabel()).toBe('SIAPE');
    });

    it('deve retornar SIAPE quando usuário é laboratorista', () => {
      const laboratorista = UsuarioTestFactory.createLaboratorista();
      component.object.set(laboratorista);

      expect(component.documentLabel()).toBe('SIAPE');
    });

    it('deve retornar SIAPE quando object é null', () => {
      component.object.set(null);

      expect(component.documentLabel()).toBe('SIAPE');
    });

    it('deve funcionar com authorities ao invés de permissoes', () => {
      const usuario = UsuarioTestFactory.create({
        permissoes: undefined as unknown as [],
        authorities: [PermissaoTestFactory.createAluno()]
      });
      component.object.set(usuario);

      expect(component.documentLabel()).toBe('RA');
    });
  });

  describe('patchFormWithObject', () => {
    it('deve preencher formulário com dados do usuário', () => {
      const form = component.buildForm();
      component.form.set(form);

      const usuario = UsuarioTestFactory.create({
        id: 10,
        nome: 'Usuário Patch',
        email: 'patch@email.com',
        telefone: '41777777777',
        documento: 'PATCH123'
      });

      component.patchFormWithObject(usuario);

      expect(form.get('id')?.value).toBe(10);
      expect(form.get('nome')?.value).toBe('Usuário Patch');
      expect(form.get('email')?.value).toBe('patch@email.com');
      expect(form.get('telefone')?.value).toBe('41777777777');
      expect(form.get('documento')?.value).toBe('PATCH123');
    });

    it('deve usar authorities se permissoes não existir', () => {
      const form = component.buildForm();
      component.form.set(form);

      const permissoes = [PermissaoTestFactory.createAdmin()];
      const usuario = UsuarioTestFactory.create({
        permissoes: undefined as unknown as [],
        authorities: permissoes
      });

      component.patchFormWithObject(usuario);

      expect(form.get('permissoes')?.value).toEqual(permissoes);
    });
  });

  describe('showDialogChangeSenha', () => {
    it('deve abrir dialog de troca de senha', () => {
      component.ngOnInit();

      component.showDialogChangeSenha();

      expect(component.dialogChangeSenha()).toBe(true);
    });

    it('deve resetar formulário de troca de senha ao abrir', () => {
      component.ngOnInit();
      const changeSenhaForm = component.changeSenhaForm();

      if (changeSenhaForm) {
        changeSenhaForm.patchValue({
          senhaAtual: 'antiga',
          novaSenha: 'nova',
          confirmarNovaSenha: 'nova'
        });
      }

      component.showDialogChangeSenha();

      expect(changeSenhaForm?.get('senhaAtual')?.value).toBeFalsy();
      expect(changeSenhaForm?.get('novaSenha')?.value).toBeFalsy();
    });
  });

  describe('getChangeSenhaError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('deve retornar mensagem de required quando campo vazio e touched', () => {
      const changeSenhaForm = component.changeSenhaForm();
      const control = changeSenhaForm?.get('senhaAtual');
      control?.setValue('');
      control?.markAsTouched();

      const error = component.getChangeSenhaError('senhaAtual');

      expect(error).toBe('Este campo é obrigatório');
    });

    it('deve retornar mensagem de minlength quando senha curta', () => {
      const changeSenhaForm = component.changeSenhaForm();
      const control = changeSenhaForm?.get('novaSenha');
      control?.setValue('123');
      control?.markAsTouched();

      const error = component.getChangeSenhaError('novaSenha');

      expect(error).toContain('Mínimo de');
    });

    it('deve retornar vazio quando controle não existe', () => {
      const error = component.getChangeSenhaError('campoInexistente');

      expect(error).toBe('');
    });

    it('deve retornar vazio quando controle não foi touched', () => {
      const changeSenhaForm = component.changeSenhaForm();
      changeSenhaForm?.get('senhaAtual')?.setValue('');

      const error = component.getChangeSenhaError('senhaAtual');

      expect(error).toBe('');
    });
  });

  describe('getPasswordMismatchError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('deve retornar mensagem quando senhas não conferem', () => {
      const changeSenhaForm = component.changeSenhaForm();
      changeSenhaForm?.patchValue({
        novaSenha: 'senha123',
        confirmarNovaSenha: 'senhaDiferente'
      });
      changeSenhaForm?.get('confirmarNovaSenha')?.markAsTouched();

      const error = component.getPasswordMismatchError();

      expect(error).toBe('As senhas não conferem');
    });

    it('deve retornar vazio quando senhas conferem', () => {
      const changeSenhaForm = component.changeSenhaForm();
      changeSenhaForm?.patchValue({
        novaSenha: 'senha123',
        confirmarNovaSenha: 'senha123'
      });
      changeSenhaForm?.get('confirmarNovaSenha')?.markAsTouched();

      const error = component.getPasswordMismatchError();

      expect(error).toBe('');
    });
  });

  describe('formatRole', () => {
    it('deve formatar role removendo prefixo e capitalizando', () => {
      const result = component.formatRole('ROLE_ADMINISTRADOR');

      expect(result).toBe('Administrador');
    });

    it('deve formatar role aluno corretamente', () => {
      const result = component.formatRole('ROLE_ALUNO');

      expect(result).toBe('Aluno');
    });
  });
});
