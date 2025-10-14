import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';

/**
 * Serviço responsável pelo gerenciamento de estado de formulários.
 *
 * Funcionalidades:
 * - Atualização de formulários com dados de objetos (patchFormWithObject)
 * - Preparação de valores do formulário para envio ao backend
 * - Mesclagem de valores do formulário com objetos existentes
 * - Reset de formulários para estado inicial
 * - Detecção de mudanças não salvas
 * - Clonagem profunda de valores de formulário
 *
 * Uso em componentes:
 * ```typescript
 * export class MyFormComponent {
 *   private stateManager = inject(FormStateManagerService);
 *
 *   edit(id: number): void {
 *     this.service.findOne(id).subscribe(object => {
 *       this.object.set(object);
 *       this.stateManager.patchFormWithObject(this.form, object);
 *     });
 *   }
 *
 *   save(): void {
 *     if (this.form.invalid) return;
 *
 *     const formValue = this.stateManager.prepareFormValue(this.form.value);
 *     const objectToSave = this.stateManager.mergeWithObject(formValue, this.object());
 *
 *     this.service.save(objectToSave).subscribe(...);
 *   }
 *
 *   reset(): void {
 *     this.stateManager.resetForm(this.form);
 *     this.object.set(null);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FormStateManagerService {
  /**
   * Atualiza um formulário com dados de um objeto
   *
   * @param formGroup Formulário a ser atualizado
   * @param object Objeto com dados para popular o formulário
   *
   * @example
   * ```typescript
   * // Em modo de edição
   * this.service.findOne(id).subscribe(user => {
   *   this.stateManager.patchFormWithObject(this.form, user);
   * });
   *
   * // O formulário será preenchido com os dados do usuário
   * // Campos não presentes no objeto não serão afetados
   * ```
   *
   * @remarks
   * Este método usa `patchValue` do Angular, que é seguro para objetos parciais.
   * Apenas os campos presentes no objeto serão atualizados no formulário.
   */
  patchFormWithObject<T>(formGroup: FormGroup | null | undefined, object: T | null | undefined): void {
    if (!formGroup || !object) {
      return;
    }

    formGroup.patchValue(object as Partial<T>);
  }

  /**
   * Prepara valores do formulário para envio ao backend
   *
   * Remove campos null/undefined/vazios que não devem ser enviados ao backend.
   * Subclasses podem sobrescrever este método para aplicar transformações customizadas.
   *
   * @param formValue Valores do formulário (obtidos via form.value)
   * @param removeEmpty Se true, remove campos vazios/null/undefined (padrão: true)
   * @returns Objeto preparado para envio ao backend
   *
   * @example
   * ```typescript
   * const formValue = this.form.value;
   * // formValue = { name: 'John', email: '', age: null, city: undefined }
   *
   * const prepared = this.stateManager.prepareFormValue(formValue);
   * // prepared = { name: 'John' }
   *
   * const preparedWithEmpty = this.stateManager.prepareFormValue(formValue, false);
   * // preparedWithEmpty = { name: 'John', email: '', age: null, city: undefined }
   * ```
   *
   * @remarks
   * Remove apenas valores null, undefined e strings vazias.
   * Números 0, booleanos false e arrays vazios são mantidos.
   */
  prepareFormValue<T>(formValue: Partial<T>, removeEmpty = true): Partial<T> {
    if (!removeEmpty) {
      return formValue;
    }

    const prepared: Partial<T> = {};

    for (const key of Object.keys(formValue)) {
      const value = formValue[key as keyof T];

      // Manter valores 0, false, arrays vazios
      // Remover apenas null, undefined e strings vazias
      if (value !== null && value !== undefined && value !== '') {
        prepared[key as keyof T] = value;
      }
    }

    return prepared;
  }

  /**
   * Mescla valores do formulário com um objeto existente
   *
   * Útil para operações de atualização (PUT/PATCH) onde queremos manter
   * campos do objeto original que não estão no formulário.
   *
   * @param formValue Valores do formulário preparados
   * @param currentObject Objeto atual/existente a ser atualizado
   * @returns Novo objeto com valores mesclados
   *
   * @example
   * ```typescript
   * const currentUser = { id: 1, name: 'John', email: 'john@test.com', createdAt: '2024-01-01' };
   * const formValue = { name: 'John Doe', email: 'john.doe@test.com' };
   *
   * const merged = this.stateManager.mergeWithObject(formValue, currentUser);
   * // merged = {
   * //   id: 1,
   * //   name: 'John Doe',
   * //   email: 'john.doe@test.com',
   * //   createdAt: '2024-01-01'
   * // }
   * ```
   *
   * @remarks
   * Usa spread operator para mesclar. Valores do formValue sobrescrevem valores do currentObject.
   * Para mesclagens profundas (nested objects), considere usar uma biblioteca como lodash.
   */
  mergeWithObject<T>(formValue: Partial<T>, currentObject: T | null | undefined): T {
    if (!currentObject) {
      return formValue as T;
    }

    return {...currentObject, ...formValue} as T;
  }

  /**
   * Reseta um formulário para seu estado inicial
   *
   * Limpa valores, erros e marcas de touched/dirty.
   * Restaura valores padrão se fornecidos.
   *
   * @param formGroup Formulário a ser resetado
   * @param defaultValues Valores padrão opcionais para restaurar no formulário
   *
   * @example
   * ```typescript
   * // Reset completo (limpa tudo)
   * this.stateManager.resetForm(this.form);
   *
   * // Reset com valores padrão
   * this.stateManager.resetForm(this.form, {
   *   country: 'Brasil',
   *   status: 'active'
   * });
   * ```
   *
   * @remarks
   * Este método usa `reset()` do Angular, que limpa valores, erros e estados.
   * Útil para criar novo registro ou cancelar edição.
   */
  resetForm<T>(formGroup: FormGroup | null | undefined, defaultValues?: Partial<T>): void {
    if (!formGroup) {
      return;
    }

    if (defaultValues) {
      formGroup.reset(defaultValues);
    } else {
      formGroup.reset();
    }
  }

  /**
   * Verifica se há mudanças não salvas no formulário
   *
   * Compara valores atuais do formulário com valores originais de um objeto.
   * Útil para implementar guards de navegação e alertas de mudanças não salvas.
   *
   * @param formGroup Formulário a verificar
   * @param originalObject Objeto original para comparação
   * @returns true se há mudanças, false caso contrário
   *
   * @example
   * ```typescript
   * // Guard de navegação
   * canDeactivate(): boolean {
   *   const hasChanges = this.stateManager.hasUnsavedChanges(
   *     this.form,
   *     this.originalUser
   *   );
   *
   *   if (hasChanges) {
   *     return confirm('Há mudanças não salvas. Deseja sair mesmo assim?');
   *   }
   *
   *   return true;
   * }
   * ```
   *
   * @remarks
   * Usa comparação simples (===) para cada campo.
   * Para comparações complexas (objetos aninhados, arrays), considere implementar lógica customizada.
   */
  hasUnsavedChanges<T>(formGroup: FormGroup | null | undefined, originalObject: T | null | undefined): boolean {
    if (!formGroup || !originalObject) {
      return false;
    }

    const currentValues = formGroup.value as Partial<T>;

    for (const key of Object.keys(currentValues)) {
      const currentValue = currentValues[key as keyof T];
      const originalValue = originalObject[key as keyof T];

      // Comparação simples para valores primitivos
      if (currentValue !== originalValue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clona profundamente os valores de um formulário
   *
   * Cria uma cópia independente dos valores do formulário.
   * Útil para salvar estado original antes de edições ou para comparações.
   *
   * @param formGroup Formulário cujos valores serão clonados
   * @returns Cópia profunda dos valores do formulário
   *
   * @example
   * ```typescript
   * // Salvar estado original para comparação posterior
   * this.service.findOne(id).subscribe(user => {
   *   this.form.patchValue(user);
   *   this.originalValues = this.stateManager.cloneFormValue(this.form);
   * });
   *
   * // Mais tarde...
   * const hasChanges = this.stateManager.hasUnsavedChanges(this.form, this.originalValues);
   * ```
   *
   * @remarks
   * Usa JSON.stringify/parse para clonagem profunda.
   * Não funciona com valores não serializáveis (funções, Date, etc).
   * Para clonagem de objetos complexos, considere usar lodash.cloneDeep().
   */
  cloneFormValue<T>(formGroup: FormGroup | null | undefined): T | null {
    if (!formGroup) {
      return null;
    }

    // Clonagem profunda usando JSON, Jest ainda não permite usar structuredClone então deixe assim
    return JSON.parse(JSON.stringify(formGroup.value)) as T;
  }

  /**
   * Identifica campos que foram modificados no formulário
   *
   * Compara valores atuais com valores originais e retorna apenas campos alterados.
   * Útil para operações PATCH onde queremos enviar apenas campos modificados.
   *
   * @param formGroup Formulário a verificar
   * @param originalObject Objeto original para comparação
   * @returns Objeto contendo apenas campos modificados
   *
   * @example
   * '`'typescript
   * const originalUser = {id: 1, name: 'John', email: 'john@test.com', age: 30 };
   * this.form.patchValue(originalUser);
   *
   * // Usuário altera apenas o email
   * this.form.patchValue({ email: 'john.doe@test.com' });
   *
   * const changes = this.stateManager.getFormChanges(this.form, originalUser);
   * // changes = { email: 'john.doe@test.com' }
   *
   * // Enviar apenas campos modificados (PATCH request)
   * this.service.patch(originalUser.id, changes).subscribe(...);
   * ```
   *
   * @remarks
   * Usa comparação simples (===) para detectar mudanças.
   * Retorna objeto vazio se não houver mudanças.
   */
  getFormChanges<T>(formGroup: FormGroup | null | undefined, originalObject: T | null | undefined): Partial<T> {
    if (!formGroup || !originalObject) {
      return {};
    }

    const currentValues = formGroup.value as Partial<T>;
    const changes: Partial<T> = {};

    for (const key of Object.keys(currentValues)) {
      const currentValue = currentValues[key as keyof T];
      const originalValue = originalObject[key as keyof T];

      if (currentValue !== originalValue) {
        changes[key as keyof T] = currentValue;
      }
    }

    return changes;
  }
}
