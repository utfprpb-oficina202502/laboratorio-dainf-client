import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {CadastrarUsuarioComponent} from './cadastrarUsuario.component';
import {CadastrarUsuarioService} from './cadastrarUsuario.service';
import {of, throwError} from 'rxjs';
import {ServiceMockFactory} from '../framework/testing/test-helpers';
import {UsuarioCadastro} from './usuarioCadastro';

/**
 * Preenche o formulário com dados válidos para testes.
 * Centraliza a configuração para evitar duplicação.
 * @param component Instância do componente
 * @param overrides Valores opcionais para sobrescrever os padrões
 */
function fillValidForm(
  component: CadastrarUsuarioComponent,
  overrides: Partial<UsuarioCadastro> = {}
): void {
  const defaults: UsuarioCadastro = {
    nome: 'Teste Usuario',
    email: 'teste@utfpr.edu.br',
    documento: '123456',
    telefone: '41999999999',
    password: 'senha123',
    confirmPassword: 'senha123'
  };
  const values = {...defaults, ...overrides};

  component.form.get('nome')?.setValue(values.nome);
  component.form.get('email')?.setValue(values.email);
  component.form.get('documento')?.setValue(values.documento);
  component.form.get('telefone')?.setValue(values.telefone);
  component.form.get('password')?.setValue(values.password);
  component.form.get('confirmPassword')?.setValue(values.confirmPassword);
}

/**
 * Cria mock de usuário válido para retorno de serviço.
 */
function createMockUsuario(overrides: Partial<UsuarioCadastro> = {}): UsuarioCadastro {
  return {
    nome: 'Teste Usuario',
    email: 'teste@utfpr.edu.br',
    documento: '123456',
    telefone: '41999999999',
    password: 'senha123',
    confirmPassword: 'senha123',
    ...overrides
  };
}

describe('CadastrarUsuarioComponent', () => {
  let component: CadastrarUsuarioComponent;
  let fixture: ComponentFixture<CadastrarUsuarioComponent>;
  let cadastrarUsuarioService: jest.Mocked<CadastrarUsuarioService>;
  let messageService: jest.Mocked<MessageService>;

  beforeEach(() => {
    const cadastrarUsuarioServiceMock = {
      saveUser: jest.fn()
    };

    messageService = ServiceMockFactory.createMessageServiceMock();

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CadastrarUsuarioComponent],
      providers: [
        provideRouter([]),
        {provide: CadastrarUsuarioService, useValue: cadastrarUsuarioServiceMock},
        {provide: MessageService, useValue: messageService}
      ]
    });

    cadastrarUsuarioService = TestBed.inject(CadastrarUsuarioService) as jest.Mocked<CadastrarUsuarioService>;
    fixture = TestBed.createComponent(CadastrarUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve criar o formulário no ngOnInit', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('nome')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('documento')).toBeTruthy();
      expect(component.form.get('telefone')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('confirmPassword')).toBeTruthy();
    });
  });

  describe('Validação do campo documento (RA/SIAPE)', () => {
    it('deve aceitar apenas números no campo documento', () => {
      const documentoControl = component.form.get('documento');

      documentoControl?.setValue('123456');
      expect(documentoControl?.valid).toBe(true);

      documentoControl?.setValue('a12345');
      expect(documentoControl?.hasError('pattern')).toBe(true);

      documentoControl?.setValue('12345a');
      expect(documentoControl?.hasError('pattern')).toBe(true);

      documentoControl?.setValue('abc');
      expect(documentoControl?.hasError('pattern')).toBe(true);
    });

    it('deve rejeitar documento com caracteres especiais', () => {
      const documentoControl = component.form.get('documento');

      documentoControl?.setValue('123-456');
      expect(documentoControl?.hasError('pattern')).toBe(true);

      documentoControl?.setValue('123.456');
      expect(documentoControl?.hasError('pattern')).toBe(true);

      documentoControl?.setValue('123 456');
      expect(documentoControl?.hasError('pattern')).toBe(true);
    });

    it('deve validar tamanho mínimo de 3 caracteres', () => {
      const documentoControl = component.form.get('documento');

      documentoControl?.setValue('12');
      expect(documentoControl?.hasError('minlength')).toBe(true);

      documentoControl?.setValue('123');
      expect(documentoControl?.hasError('minlength')).toBe(false);
    });

    it('deve ser obrigatório', () => {
      const documentoControl = component.form.get('documento');

      documentoControl?.setValue('');
      expect(documentoControl?.hasError('required')).toBe(true);
    });
  });

  describe('Método onDocumentoInput', () => {
    it('deve filtrar letras do input em tempo real', () => {
      const mockEvent = {
        target: {value: 'abc123def'}
      } as unknown as Event;

      component.onDocumentoInput(mockEvent);

      expect((mockEvent.target as HTMLInputElement).value).toBe('123');
      expect(component.form.get('documento')?.value).toBe('123');
    });

    it('deve manter valor quando já é numérico', () => {
      const mockEvent = {
        target: {value: '123456'}
      } as unknown as Event;

      component.onDocumentoInput(mockEvent);

      expect((mockEvent.target as HTMLInputElement).value).toBe('123456');
    });

    it('deve remover todos os caracteres não numéricos', () => {
      const mockEvent = {
        target: {value: 'a1b2c3d4e5'}
      } as unknown as Event;

      component.onDocumentoInput(mockEvent);

      expect((mockEvent.target as HTMLInputElement).value).toBe('12345');
    });

    it('deve retornar string vazia quando input contém apenas letras', () => {
      const mockEvent = {
        target: {value: 'abcdef'}
      } as unknown as Event;

      component.onDocumentoInput(mockEvent);

      expect((mockEvent.target as HTMLInputElement).value).toBe('');
    });

    it('deve filtrar caracteres Unicode não numéricos (números árabes, etc)', () => {
      // Números árabes: ١٢٣ (não são dígitos ASCII 0-9)
      const mockEventArabic = {
        target: {value: '١٢٣'}
      } as unknown as Event;

      component.onDocumentoInput(mockEventArabic);
      expect((mockEventArabic.target as HTMLInputElement).value).toBe('');

      // Mix de Unicode e ASCII
      const mockEventMix = {
        target: {value: '12３４56'}  // 3 e 4 são fullwidth
      } as unknown as Event;

      component.onDocumentoInput(mockEventMix);
      expect((mockEventMix.target as HTMLInputElement).value).toBe('1256');
    });

    it('deve filtrar emojis e caracteres especiais Unicode', () => {
      const mockEvent = {
        target: {value: '123🔢456'}
      } as unknown as Event;

      component.onDocumentoInput(mockEvent);

      expect((mockEvent.target as HTMLInputElement).value).toBe('123456');
    });
  });

  describe('Validação do campo email', () => {
    it('deve aceitar email @utfpr.edu.br', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('teste@utfpr.edu.br');
      expect(emailControl?.hasError('utfprEmail')).toBe(false);
    });

    it('deve aceitar email @alunos.utfpr.edu.br', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('teste@alunos.utfpr.edu.br');
      expect(emailControl?.hasError('utfprEmail')).toBe(false);
    });

    it('deve rejeitar email de outro domínio', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('teste@gmail.com');
      expect(emailControl?.hasError('utfprEmail')).toBe(true);

      emailControl?.setValue('teste@hotmail.com');
      expect(emailControl?.hasError('utfprEmail')).toBe(true);
    });
  });

  describe('Validação de senhas', () => {
    it('deve validar tamanho mínimo da senha', () => {
      const passwordControl = component.form.get('password');

      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('deve validar se as senhas conferem', () => {
      component.form.get('password')?.setValue('senha123');
      component.form.get('confirmPassword')?.setValue('senha456');

      expect(component.form.hasError('passwordMismatch')).toBe(true);

      component.form.get('confirmPassword')?.setValue('senha123');
      expect(component.form.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('Método getErrorMessage', () => {
    it('deve retornar mensagem de campo obrigatório', () => {
      const documentoControl = component.form.get('documento');
      documentoControl?.setValue('');
      documentoControl?.markAsTouched();

      expect(component.getErrorMessage('documento')).toBe('Este campo é obrigatório');
    });

    it('deve retornar mensagem de tamanho mínimo', () => {
      const documentoControl = component.form.get('documento');
      documentoControl?.setValue('12');
      documentoControl?.markAsTouched();

      expect(component.getErrorMessage('documento')).toBe('Mínimo de 3 caracteres');
    });

    it('deve retornar mensagem de padrão numérico para documento', () => {
      const documentoControl = component.form.get('documento');
      documentoControl?.setValue('abc123');
      documentoControl?.markAsTouched();

      expect(component.getErrorMessage('documento')).toBe('O RA/SIAPE deve conter apenas números');
    });

    it('deve retornar mensagem de email UTFPR', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('teste@gmail.com');
      emailControl?.markAsTouched();

      expect(component.getErrorMessage('email')).toBe('Digite um email válido da UTFPR (@utfpr.edu.br ou @alunos.utfpr.edu.br)');
    });

    it('deve retornar string vazia quando campo não foi tocado', () => {
      expect(component.getErrorMessage('documento')).toBe('');
    });
  });

  describe('Método getPasswordMatchError', () => {
    it('deve retornar mensagem quando senhas não conferem', () => {
      component.form.get('password')?.setValue('senha123');
      component.form.get('confirmPassword')?.setValue('senha456');
      component.form.get('confirmPassword')?.markAsTouched();

      expect(component.getPasswordMatchError()).toBe('As senhas não conferem');
    });

    it('deve retornar string vazia quando senhas conferem', () => {
      component.form.get('password')?.setValue('senha123');
      component.form.get('confirmPassword')?.setValue('senha123');
      component.form.get('confirmPassword')?.markAsTouched();

      expect(component.getPasswordMatchError()).toBe('');
    });
  });

  describe('Método submit', () => {
    it('não deve enviar se formulário for inválido', () => {
      component.form.get('nome')?.setValue('');
      component.submit();

      expect(cadastrarUsuarioService.saveUser).not.toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Por favor, preencha todos os campos corretamente.'
        })
      );
    });

    it('deve enviar quando formulário for válido', () => {
      cadastrarUsuarioService.saveUser.mockReturnValue(of(createMockUsuario()));
      fillValidForm(component);

      component.submit();

      expect(cadastrarUsuarioService.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Teste Usuario',
          email: 'teste@utfpr.edu.br',
          documento: '123456',
          telefone: '41999999999',
          password: 'senha123',
          confirmPassword: 'senha123'
        })
      );
    });

    it('deve mostrar mensagem de sucesso após cadastro', () => {
      cadastrarUsuarioService.saveUser.mockReturnValue(of(createMockUsuario()));
      fillValidForm(component);

      component.submit();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Sucesso'
        })
      );
    });

    it('deve mostrar mensagem de erro quando cadastro falha', () => {
      cadastrarUsuarioService.saveUser.mockReturnValue(throwError(() => new Error('Erro')));
      fillValidForm(component);

      component.submit();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Atenção'
        })
      );
    });
  });
});
