import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement, Provider, Type} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {ConfirmationService} from 'primeng/api';

/**
 * Utilitários para testes Angular
 * Reduz duplicação e padroniza setup de testes
 */

/**
 * Configuração para setupTestBed
 */
export interface TestBedConfig {
  imports?: any[];
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
  const mock: any = {};
  methods.forEach(method => {
    mock[method] = jest.fn();
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
  fixture: ComponentFixture<any>,
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
  value: any = '',
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
  value: any
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
  confirmationService.confirm.mockImplementation((config: any) => {
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
  confirmationService.confirm.mockImplementation((config: any) => {
    config.reject?.();
    return confirmationService;
  });
}
