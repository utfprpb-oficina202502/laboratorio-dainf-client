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
   * Obtém mensagem de erro apropriada para um controle de formulário
   *
   * @param control Controle de formulário a ser validado
   * @returns Mensagem de erro em pt-BR ou string vazia se não houver erro
   *
   * @example
   * ```typescript
   * const nameControl = this.form.get('name');
   * const errorMsg = this.validationService.getErrorMessage(nameControl);
   * // Se required: 'Este campo é obrigatório'
   * // Se minlength: 'Mínimo de X caracteres'
   * // Se email: 'E-mail inválido'
   * ```
   */
  getErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control?.errors || !control?.touched) {
      return '';
    }

    const errors = control.errors;

    // Validadores nativos do Angular
    if (errors['required']) {
      return 'Este campo é obrigatório';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `Mínimo de ${requiredLength} caracteres`;
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `Máximo de ${requiredLength} caracteres`;
    }

    if (errors['email']) {
      return 'E-mail inválido';
    }

    if (errors['pattern']) {
      return 'Formato inválido';
    }

    if (errors['min']) {
      const min = errors['min'].min;
      return `Valor mínimo: ${min}`;
    }

    if (errors['max']) {
      const max = errors['max'].max;
      return `Valor máximo: ${max}`;
    }

    // Erro retornado pelo servidor (RFC 9457)
    if (errors['serverError']) {
      return errors['serverError'];
    }

    // Mensagem genérica para validadores customizados
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
