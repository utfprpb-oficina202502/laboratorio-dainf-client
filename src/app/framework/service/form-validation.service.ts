import {Injectable} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

/**
 * Serviço responsável pela validação de formulários e geração de mensagens de erro.
 *
 * Funcionalidades:
 * - Geração de mensagens de erro padronizadas para validadores comuns
 * - Verificação de estado de validação de campos (erro, válido)
 * - Marcação recursiva de formulários como touched
 * - Suporte a validadores nativos do Angular (required, minlength, maxlength, email, pattern, min, max)
 * - Mensagens em português brasileiro
 *
 * Uso em componentes:
 * ```typescript
 * export class MyFormComponent {
 *   private validationService = inject(FormValidationService);
 *
 *   getError(fieldName: string): string {
 *     const control = this.form.get(fieldName);
 *     return this.validationService.getErrorMessage(control);
 *   }
 *
 *   isInvalid(fieldName: string): boolean {
 *     const control = this.form.get(fieldName);
 *     return this.validationService.hasError(control);
 *   }
 *
 *   onSubmit(): void {
 *     if (this.form.invalid) {
 *       this.validationService.markFormAsTouched(this.form);
 *       return;
 *     }
 *     // Processar formulário válido
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  /**
   * Mapeamento de tipos de erro para funções que geram mensagens.
   * A ordem define a prioridade (required primeiro).
   */
  private readonly errorMessageGenerators: readonly {
    key: string;
    getMessage: (errorValue: unknown) => string;
  }[] = [
    {key: 'required', getMessage: () => 'Este campo é obrigatório'},
    {
      key: 'minlength',
      getMessage: (err) => `Mínimo de ${(err as {
        requiredLength: number
      }).requiredLength} caracteres`
    },
    {
      key: 'maxlength',
      getMessage: (err) => `Máximo de ${(err as {
        requiredLength: number
      }).requiredLength} caracteres`
    },
    {key: 'email', getMessage: () => 'E-mail inválido'},
    {key: 'pattern', getMessage: () => 'Formato inválido'},
    {key: 'min', getMessage: (err) => `Valor mínimo: ${(err as { min: number }).min}`},
    {key: 'max', getMessage: (err) => `Valor máximo: ${(err as { max: number }).max}`},
    {key: 'serverError', getMessage: (err) => err as string}
  ];

  /**
   * Obtém mensagem de erro apropriada para um controle de formulário
   *
   * @param control Controle de formulário a ser validado
   * @param customMessages Mapa opcional de mensagens customizadas por tipo de erro
   * @param options Opções adicionais (checkTouched: se deve verificar touched, default true)
   * @returns Mensagem de erro em pt-BR ou string vazia se não houver erro
   *
   * @example
   * ```typescript
   * // Uso básico
   * const nameControl = this.form.get('name');
   * const errorMsg = this.validationService.getErrorMessage(nameControl);
   * // Se required: 'Este campo é obrigatório'
   * // Se minlength: 'Mínimo de X caracteres'
   * // Se email: 'E-mail inválido'
   *
   * // Com mensagens customizadas
   * const customMessages = {
   *   pattern: 'O RA/SIAPE deve conter apenas números',
   *   utfprEmail: 'Digite um email válido da UTFPR'
   * };
   * const errorMsg = this.validationService.getErrorMessage(control, customMessages);
   * ```
   */
  getErrorMessage(
    control: AbstractControl | null | undefined,
    customMessages?: Record<string, string>,
    options?: { checkTouched?: boolean }
  ): string {
    const errors = this.getDisplayableErrors(control, options?.checkTouched ?? true);
    if (!errors) {
      return '';
    }

    // Verifica mensagens customizadas primeiro (permite sobrescrever padrões)
    const customMessage = this.findCustomMessage(errors, customMessages);
    if (customMessage) {
      return customMessage;
    }

    // Busca mensagem padrão baseada no tipo de erro
    return this.findStandardMessage(errors);
  }

  /**
   * Retorna os erros do controle se devem ser exibidos, ou null caso contrário.
   * Encapsula a lógica de verificação de touched e existência de erros.
   */
  private getDisplayableErrors(
    control: AbstractControl | null | undefined,
    checkTouched: boolean
  ): Record<string, unknown> | null {
    if (!control?.errors) {
      return null;
    }
    if (checkTouched && !control.touched) {
      return null;
    }
    return control.errors;
  }

  /**
   * Busca mensagem customizada para os erros do controle
   */
  private findCustomMessage(
    errors: Record<string, unknown>,
    customMessages?: Record<string, string>
  ): string | null {
    if (!customMessages) {
      return null;
    }

    for (const errorKey of Object.keys(errors)) {
      if (customMessages[errorKey]) {
        return customMessages[errorKey];
      }
    }
    return null;
  }

  /**
   * Busca mensagem padrão baseada no tipo de erro
   */
  private findStandardMessage(errors: Record<string, unknown>): string {
    for (const generator of this.errorMessageGenerators) {
      if (errors[generator.key]) {
        return generator.getMessage(errors[generator.key]);
      }
    }
    return 'Campo inválido';
  }

  /**
   * Verifica se um controle de formulário possui erro
   *
   * @param control Controle de formulário a ser verificado
   * @returns true se o controle é inválido e foi touched, false caso contrário
   *
   * @example
   * ```typescript
   * const emailControl = this.form.get('email');
   * const hasError = this.validationService.hasError(emailControl);
   * // true se controle inválido e touched, false caso contrário
   *
   * // Uso em template
   * <input [class.error]="validationService.hasError(form.get('email'))" />
   * ```
   */
  hasError(control: AbstractControl | null | undefined): boolean {
    if (!control) {
      return false;
    }

    return control.invalid && control.touched;
  }

  /**
   * Verifica se um controle de formulário é válido e foi touched
   *
   * @param control Controle de formulário a ser verificado
   * @returns true se o controle é válido e foi touched, false caso contrário
   *
   * @example
   * ```typescript
   * const passwordControl = this.form.get('password');
   * const isValid = this.validationService.isValidField(passwordControl);
   * // true se controle válido e touched, false caso contrário
   *
   * // Uso em template para feedback visual positivo
   * <input [class.valid]="validationService.isValidField(form.get('password'))" />
   * ```
   */
  isValidField(control: AbstractControl | null | undefined): boolean {
    if (!control) {
      return false;
    }

    return control.valid && control.touched;
  }

  /**
   * Marca todos os controles de um FormGroup como touched recursivamente
   * Útil para exibir todas as mensagens de erro quando usuário tenta submeter formulário inválido
   *
   * @param formGroup FormGroup a ser marcado como touched
   *
   * @example
   * ```typescript
   * onSubmit(): void {
   *   if (this.form.invalid) {
   *     // Marca todos os campos como touched para mostrar erros
   *     this.validationService.markFormAsTouched(this.form);
   *
   *     this.messageService.add({
   *       severity: 'info',
   *       detail: 'Necessário preencher todos os campos corretamente!'
   *     });
   *     return;
   *   }
   *
   *   // Processar formulário válido
   *   this.save();
   * }
   * ```
   *
   * @remarks
   * Este método é recursivo e funciona com FormGroups aninhados.
   * Todos os controles dentro de FormGroups aninhados também serão marcados como touched.
   */
  markFormAsTouched(formGroup: FormGroup): void {
    if (!formGroup) {
      return;
    }

    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);

      if (!control) {
        continue;
      }

      control.markAsTouched();

      // Recursão para FormGroups aninhados
      if (control instanceof FormGroup) {
        this.markFormAsTouched(control);
      }
    }
  }

  /**
   * Verifica se um FormGroup possui algum erro
   *
   * @param formGroup FormGroup a ser verificado
   * @returns true se o FormGroup ou algum de seus controles possui erro, false caso contrário
   *
   * @example
   * ```typescript
   * const addressGroup = this.form.get('address') as FormGroup;
   * const hasErrors = this.validationService.hasFormGroupErrors(addressGroup);
   *
   * if (hasErrors) {
   *   console.log('Grupo de endereço possui erros');
   * }
   * ```
   */
  hasFormGroupErrors(formGroup: FormGroup | null | undefined): boolean {
    if (!formGroup) {
      return false;
    }

    return formGroup.invalid;
  }

  /**
   * Obtém todos os erros de um FormGroup de forma recursiva
   *
   * @param formGroup FormGroup a ser analisado
   * @param path Caminho atual (usado internamente para recursão)
   * @returns Objeto com todos os erros encontrados, organizados por caminho do campo
   *
   * @example
   * ```typescript
   * const allErrors = this.validationService.getAllErrors(this.form);
   * // {
   * //   'name': { required: true },
   * //   'email': { email: true },
   * //   'address.street': { required: true }
   * // }
   *
   * // Útil para debugging ou exibir todos os erros de uma vez
   * console.log('Erros no formulário:', allErrors);
   * ```
   */
  getAllErrors(formGroup: FormGroup, path = ''): Record<string, unknown> {
    if (!formGroup) {
      return {};
    }

    const errors: Record<string, unknown> = {};

    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      if (!control) {
        continue;
      }

      const currentPath = path ? `${path}.${key}` : key;

      if (control instanceof FormGroup) {
        // Recursão para FormGroups aninhados
        Object.assign(errors, this.getAllErrors(control, currentPath));
      } else if (control.errors) {
        errors[currentPath] = control.errors;
      }
    }

    return errors;
  }

  /**
   * Limpa todos os erros de um FormGroup
   *
   * @param formGroup FormGroup a ter os erros limpos
   *
   * @example
   * ```typescript
   * // Limpar erros após correção externa
   * this.validationService.clearErrors(this.form);
   *
   * // Útil quando erros são definidos programaticamente e precisam ser resetados
   * someControl.setErrors({customError: true});
   * // ... depois
   * this.validationService.clearErrors(this.form);
   * ```
   */
  clearErrors(formGroup: FormGroup): void {
    if (!formGroup) {
      return;
    }

    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      if (!control) {
        continue;
      }

      if (control instanceof FormGroup) {
        this.clearErrors(control);
      } else {
        control.setErrors(null);
      }
    }
  }
}
