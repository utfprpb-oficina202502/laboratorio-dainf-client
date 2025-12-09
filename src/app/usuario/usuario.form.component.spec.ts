import {TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {of, throwError} from 'rxjs';
import {UsuarioFormComponent} from './usuario.form.component';
import {UsuarioService} from './usuario.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoggerService} from '../framework/service/logger.service';
import {LoginService} from '../login/login.service';
import {FormValidationService} from '../framework/service/form-validation.service';
import {FormStateManagerService} from '../framework/service/form-state-manager.service';
import {FormBusinessRulesService} from '../framework/service/form-business-rules.service';
import {ErrorHandlerService} from '../framework/service/error-handler.service';
import {PermissaoTestFactory, UsuarioTestFactory} from './usuario.test-factory';

describe('UsuarioFormComponent', () => {
  let component: any; // Usando any para acessar membros protected nos testes
  let fixture: any;
  let usuarioService: jest.Mocked<UsuarioService>;
  let messageService: jest.Mocked<MessageService>;
  let loaderService: jest.Mocked<LoaderService>;

  beforeEach(() => {
    const usuarioServiceMock = {
      findAllPermissao: jest.fn().mockReturnValue(of(PermissaoTestFactory.createAll())),
      save: jest.fn().mockReturnValue(of(UsuarioTestFactory.create())),
      changeSenha: jest.fn().mockReturnValue(of({})),
      findById: jest.fn().mockReturnValue(of(UsuarioTestFactory.create()))
    };

    const messageServiceMock = {
      add: jest.fn()
    };

    const loaderServiceMock = {
      show: jest.fn(),
      hide: jest.fn()
    };

    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockReturnValue(of(null))
    };

    const activatedRouteMock = {
      params: of({})
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, UsuarioFormComponent],
      providers: [
        provideRouter([]),
        FormBuilder,
        {provide: MessageService, useValue: messageServiceMock},
        {provide: UsuarioService, useValue: usuarioServiceMock},
        {provide: LoaderService, useValue: loaderServiceMock},
        {provide: LoggerService, useValue: {error: jest.fn(), warn: jest.fn()}},
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

    usuarioService = TestBed.inject(UsuarioService) as jest.Mocked<UsuarioService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loaderService = TestBed.inject(LoaderService) as jest.Mocked<LoaderService>;
    fixture = TestBed.createComponent(UsuarioFormComponent);
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
      expect(form.get('password')).toBeTruthy();
    });

    it('deve ter campo id desabilitado', () => {
      const form = component.buildForm();

      expect(form.get('id')?.disabled).toBe(true);
    });

    it('não deve ter campo username', () => {
      const form = component.buildForm();

      expect(form.get('username')).toBeFalsy();
    });

    it('deve ter validadores required em campos obrigatórios', () => {
      const form = component.buildForm();

      form.get('nome')?.setValue('');
      form.get('email')?.setValue('');
      form.get('telefone')?.setValue('');
      form.get('permissoes')?.setValue([]);

      expect(form.get('nome')?.errors?.['required']).toBe(true);
      expect(form.get('email')?.errors?.['required']).toBe(true);
      expect(form.get('telefone')?.errors?.['required']).toBe(true);
      expect(form.get('permissoes')?.errors?.['required']).toBe(true);
    });

    it('deve validar formato de email', () => {
      const form = component.buildForm();

      form.get('email')?.setValue('email-invalido');

      expect(form.get('email')?.errors?.['email']).toBe(true);
    });
  });

  describe('prepareFormValue', () => {
    it('deve adicionar username igual ao email para retrocompatibilidade', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        id: null,
        nome: 'Novo Usuário',
        email: 'novo@email.com',
        telefone: '41999999999',
        documento: '123456',
        permissoes: [PermissaoTestFactory.createAluno()],
        password: 'senha123'
      });

      const result = component.prepareFormValue({nome: 'Novo Usuário'});

      expect(result.username).toBe('novo@email.com');
    });

    it('deve incluir password para usuário novo', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        email: 'teste@email.com',
        password: 'senha123'
      });

      const result = component.prepareFormValue({});

      expect(result.password).toBe('senha123');
      expect(result.username).toBe('teste@email.com');
    });

    it('deve incluir id quando existente', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        id: 5,
        email: 'existente@email.com'
      });

      const result = component.prepareFormValue({});

      expect(result.id).toBe(5);
      expect(result.username).toBe('existente@email.com');
    });

    it('não deve incluir password vazio', () => {
      const form = component.buildForm();
      component.form.set(form);

      form.patchValue({
        email: 'teste@email.com',
        password: ''
      });

      const result = component.prepareFormValue({});

      expect(result.password).toBeUndefined();
    });
  });

  describe('isEditMode', () => {
    it('deve retornar false quando object não tem id', () => {
      component.object.set({});

      expect(component.isEditMode()).toBe(false);
    });

    it('deve retornar true quando object tem id', () => {
      const usuario = UsuarioTestFactory.create({id: 10});
      component.object.set(usuario);

      expect(component.isEditMode()).toBe(true);
    });

    it('deve retornar false quando object é null', () => {
      component.object.set(null);

      expect(component.isEditMode()).toBe(false);
    });
  });

  describe('canShowPasswordChange', () => {
    it('deve retornar true em modo de edição', () => {
      const usuario = UsuarioTestFactory.create({id: 5});
      component.object.set(usuario);

      expect(component.canShowPasswordChange()).toBe(true);
    });

    it('deve retornar false para novo usuário', () => {
      component.object.set({});

      expect(component.canShowPasswordChange()).toBe(false);
    });
  });

  describe('patchFormWithObject', () => {
    it('deve preencher formulário com dados do usuário', () => {
      const form = component.buildForm();
      component.form.set(form);

      const usuario = UsuarioTestFactory.create({
        id: 10,
        nome: 'Usuário Existente',
        email: 'existente@email.com',
        telefone: '41888888888',
        documento: 'DOC999',
        permissoes: [PermissaoTestFactory.createProfessor()]
      });

      component.patchFormWithObject(usuario);

      expect(form.get('id')?.value).toBe(10);
      expect(form.get('nome')?.value).toBe('Usuário Existente');
      expect(form.get('email')?.value).toBe('existente@email.com');
      expect(form.get('telefone')?.value).toBe('41888888888');
      expect(form.get('documento')?.value).toBe('DOC999');
    });

    it('deve desabilitar campo password para usuário existente', () => {
      const form = component.buildForm();
      component.form.set(form);

      const usuario = UsuarioTestFactory.create({id: 5});

      component.patchFormWithObject(usuario);

      expect(form.get('password')?.disabled).toBe(true);
    });
  });

  describe('formatRule', () => {
    it('deve formatar role removendo prefixo e capitalizando', () => {
      const result = component.formatRule('ROLE_ADMINISTRADOR');

      expect(result).toBe('Administrador');
    });

    it('deve formatar role laboratorista corretamente', () => {
      const result = component.formatRule('ROLE_LABORATORISTA');

      expect(result).toBe('Laboratorista');
    });

    it('deve formatar role professor corretamente', () => {
      const result = component.formatRule('ROLE_PROFESSOR');

      expect(result).toBe('Professor');
    });

    it('deve formatar role aluno corretamente', () => {
      const result = component.formatRule('ROLE_ALUNO');

      expect(result).toBe('Aluno');
    });
  });

  describe('buildGrupoDeAcesso', () => {
    it('deve carregar permissões e popular dropdown', async () => {
      fixture.detectChanges();

      // Aguarda carregamento
      await Promise.resolve();

      expect(usuarioService.findAllPermissao).toHaveBeenCalled();
      expect(component.grupoAcessoDropdown().length).toBe(4);
    });

    it('deve exibir erro quando falha ao carregar permissões', async () => {
      usuarioService.findAllPermissao.mockReturnValue(throwError(() => new Error('Erro')));

      component.buildGrupoDeAcesso();
      await Promise.resolve();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Erro ao carregar grupos de acesso.'
        })
      );
    });
  });

  describe('showDialogChangeSenha', () => {
    it('deve abrir dialog de troca de senha', () => {
      component.showDialogChangeSenha();

      expect(component.dialogChangeSenha()).toBe(true);
    });

    it('deve resetar formulário ao abrir', () => {
      const form = component.formChangeSenha();
      if (form) {
        form.patchValue({
          senhaAtual: 'antiga',
          novaSenha: 'nova',
          confirmarNovaSenha: 'nova'
        });
      }

      component.showDialogChangeSenha();

      expect(form?.get('senhaAtual')?.value).toBeFalsy();
    });
  });

  describe('redefinirSenha', () => {
    beforeEach(() => {
      const usuario = UsuarioTestFactory.create({id: 1});
      component.object.set(usuario);
    });

    it('deve exibir warning quando senhas não conferem', () => {
      const form = component.formChangeSenha();
      form?.patchValue({
        senhaAtual: 'senhaAtual',
        novaSenha: 'novaSenha123',
        confirmarNovaSenha: 'senhaDiferente'
      });

      component.redefinirSenha();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          detail: 'Senhas não conferem!'
        })
      );
    });

    it('deve chamar service quando formulário válido e senhas conferem', () => {
      const form = component.formChangeSenha();
      form?.patchValue({
        senhaAtual: 'senhaAtual',
        novaSenha: 'novaSenha123',
        confirmarNovaSenha: 'novaSenha123'
      });

      component.redefinirSenha();

      expect(usuarioService.changeSenha).toHaveBeenCalled();
      expect(loaderService.show).toHaveBeenCalled();
    });

    it('deve fechar dialog após sucesso', async () => {
      const form = component.formChangeSenha();
      form?.patchValue({
        senhaAtual: 'senhaAtual',
        novaSenha: 'novaSenha123',
        confirmarNovaSenha: 'novaSenha123'
      });

      component.dialogChangeSenha.set(true);
      component.redefinirSenha();

      await Promise.resolve();

      expect(component.dialogChangeSenha()).toBe(false);
    });

    it('deve exibir erro quando senha atual incorreta', async () => {
      usuarioService.changeSenha.mockReturnValue(throwError(() => new Error('Senha incorreta')));

      const form = component.formChangeSenha();
      form?.patchValue({
        senhaAtual: 'senhaErrada',
        novaSenha: 'novaSenha123',
        confirmarNovaSenha: 'novaSenha123'
      });

      component.redefinirSenha();
      await Promise.resolve();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'A senha atual está incorreta!'
        })
      );
    });

    it('deve marcar campos como touched quando formulário inválido', () => {
      const form = component.formChangeSenha();
      form?.patchValue({
        senhaAtual: '',
        novaSenha: '',
        confirmarNovaSenha: ''
      });

      component.redefinirSenha();

      expect(form?.get('senhaAtual')?.touched).toBe(true);
      expect(form?.get('novaSenha')?.touched).toBe(true);
      expect(form?.get('confirmarNovaSenha')?.touched).toBe(true);
    });
  });
});
