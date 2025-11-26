import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement, Provider, Type} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {Confirmation, ConfirmationService, MessageService} from 'primeng/api';
import {LoaderService} from '../loader/loader.service';
import {LoggerService} from '../services/logger.service';
import {LoginService} from '../../login/login.service';

/**
 * Utilitários para testes Angular
 * Reduz duplicação e padroniza setup de testes
 */

/**
 * Configuração para setupTestBed
 */
export interface TestBedConfig {
  imports?: unknown[];
  providers?: Provider[];
}

/**
 * Helper para configurar TestBed com mocks de serviços
 * @param component Componente a ser testado
 * @param config Configuração de imports e providers
 * @returns Fixture e instância do componente
 *
 * @example
 * const {fixture, component} = await setupTestBed(MyComponent, {
 *   imports: [RouterTestingModule],
 *   providers: [{provide: MyService, useValue: mockService}]
 * });
 */
export async function setupTestBed<T>(
  component: Type<T>,
  config: TestBedConfig
): Promise<{
  fixture: ComponentFixture<T>;
  component: T;
}> {
  await TestBed.configureTestingModule({
    imports: config.imports || [],
    providers: config.providers || []
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  const componentInstance = fixture.componentInstance;
  fixture.detectChanges();

  return {fixture, component: componentInstance};
}

/**
 * Cria mock de serviço com métodos Jest
 * @param methods Lista de métodos a serem mockados
 * @returns Mock do serviço com métodos jest.fn()
 *
 * @example
 * const mockService = createServiceMock<MyService>(['getData', 'saveData']);
 * mockService.getData.mockReturnValue(of(data));
 */
export function createServiceMock<T>(methods: (keyof T)[]): jest.Mocked<Partial<T>> {
  const mock: Record<string, jest.Mock> = {};
  methods.forEach(method => {
    mock[method as string] = jest.fn();
  });
  return mock as jest.Mocked<Partial<T>>;
}

/**
 * Busca elementos de formulário por formControlName
 * @param fixture Fixture do componente
 * @param controlNames Lista de nomes de controles
 * @returns Objeto com elementos encontrados
 *
 * @example
 * const elements = queryFormControls(fixture, ['email', 'password']);
 * expect(elements.email).toBeTruthy();
 */
export function queryFormControls(
  fixture: ComponentFixture<unknown>,
  controlNames: string[]
): Record<string, DebugElement> {
  const elements: Record<string, DebugElement> = {};

  controlNames.forEach(name => {
    elements[name] = fixture.debugElement.query(By.css(`[formControlName="${name}"]`));
  });

  return elements;
}

/**
 * Obtém diretiva de elemento de debug
 * @param element Elemento debug
 * @param directiveType Tipo da diretiva
 * @returns Instância da diretiva
 *
 * @example
 * const directive = getDirective(element, ValidationDirective);
 */
export function getDirective<T>(element: DebugElement, directiveType: Type<T>): T {
  return element.injector.get(directiveType);
}

/**
 * Opções para configurar estado de FormControl
 */
export interface FormControlStateOptions {
  markAsTouched?: boolean;
  markAsDirty?: boolean;
}

/**
 * Configura FormControl em estado inválido para testes de validação
 * @param form FormGroup contendo o controle
 * @param controlName Nome do controle
 * @param value Valor a ser definido (padrão: '')
 * @param options Opções de estado
 * @returns FormControl configurado
 *
 * @example
 * setFormControlInvalid(form, 'email', '');
 * expect(form.get('email')?.valid).toBe(false);
 */
export function setFormControlInvalid(
  form: FormGroup,
  controlName: string,
  value: unknown = '',
  options?: FormControlStateOptions
): FormControl {
  const control = form.get(controlName) as FormControl;

  if (options?.markAsDirty !== false) {
    control.markAsDirty();
  }
  if (options?.markAsTouched) {
    control.markAsTouched();
  }

  control.setValue(value);
  return control;
}

/**
 * Configura FormControl em estado válido para testes
 * @param form FormGroup contendo o controle
 * @param controlName Nome do controle
 * @param value Valor válido a ser definido
 * @returns FormControl configurado
 *
 * @example
 * setFormControlValid(form, 'email', 'test@example.com');
 * expect(form.get('email')?.valid).toBe(true);
 */
export function setFormControlValid(
  form: FormGroup,
  controlName: string,
  value: unknown
): FormControl {
  const control = form.get(controlName) as FormControl;
  control.markAsDirty();
  control.setValue(value);
  return control;
}

/**
 * Mock ConfirmationService para aceitar confirmação automaticamente
 * @param confirmationService Serviço mockado
 *
 * @example
 * mockConfirmAccept(confirmationService);
 * component.delete();
 * expect(deleteService.delete).toHaveBeenCalled();
 */
export function mockConfirmAccept(confirmationService: jest.Mocked<ConfirmationService>): void {
  confirmationService.confirm.mockImplementation((config: Confirmation) => {
    config.accept?.();
    return confirmationService;
  });
}

/**
 * Mock ConfirmationService para rejeitar confirmação automaticamente
 * @param confirmationService Serviço mockado
 *
 * @example
 * mockConfirmReject(confirmationService);
 * component.delete();
 * expect(deleteService.delete).not.toHaveBeenCalled();
 */
export function mockConfirmReject(confirmationService: jest.Mocked<ConfirmationService>): void {
  confirmationService.confirm.mockImplementation((config: Confirmation) => {
    config.reject?.();
    return confirmationService;
  });
}

/**
 * Factory para criar mocks de serviços comuns
 * Reduz duplicação e padroniza setup de mocks
 */
export class ServiceMockFactory {
  /**
   * Cria mock do MessageService
   */
  static createMessageServiceMock(): jest.Mocked<MessageService> {
    return {
      add: jest.fn(),
      clear: jest.fn()
    } as unknown as jest.Mocked<MessageService>;
  }

  /**
   * Cria mock do ConfirmationService
   */
  static createConfirmationServiceMock(): jest.Mocked<ConfirmationService> {
    return {
      confirm: jest.fn()
    } as unknown as jest.Mocked<ConfirmationService>;
  }

  /**
   * Cria mock do LoaderService
   */
  static createLoaderServiceMock(): jest.Mocked<LoaderService> {
    return {
      show: jest.fn(),
      hide: jest.fn(),
      showWithCancel: jest.fn()
    } as unknown as jest.Mocked<LoaderService>;
  }

  /**
   * Cria mock do LoggerService
   */
  static createLoggerServiceMock(): jest.Mocked<LoggerService> {
    return {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as unknown as jest.Mocked<LoggerService>;
  }

  /**
   * Cria mock do LoginService básico
   */
  static createLoginServiceMock(overrides?: Partial<jest.Mocked<LoginService>>): jest.Mocked<LoginService> {
    const defaultMock = {
      getCurrentUser: jest.fn(),
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      hasAnyRole: jest.fn().mockReturnValue(false),
      logout: jest.fn()
    } as unknown as jest.Mocked<LoginService>;

    return {...defaultMock, ...overrides} as jest.Mocked<LoginService>;
  }

  /**
   * Cria conjunto de mocks comuns para componentes CRUD
   */
  static createCrudServiceMocks(): {
    messageService: jest.Mocked<MessageService>;
    confirmationService: jest.Mocked<ConfirmationService>;
    loaderService: jest.Mocked<LoaderService>;
    loggerService: jest.Mocked<LoggerService>;
  } {
    return {
      messageService: this.createMessageServiceMock(),
      confirmationService: this.createConfirmationServiceMock(),
      loaderService: this.createLoaderServiceMock(),
      loggerService: this.createLoggerServiceMock()
    };
  }
}
