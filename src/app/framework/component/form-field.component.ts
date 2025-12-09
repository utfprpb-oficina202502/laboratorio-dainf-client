import {Component, inject, input} from '@angular/core';

import {AbstractControl} from '@angular/forms';
import {FormValidationService} from '../service/form-validation.service';

/**
 * Reusable form field wrapper component that handles validation display
 *
 * Usage:
 * <app-form-field [control]="form().get('name')" label="Nome" [required]="true">
 *   <input pInputText formControlName="name" />
 * </app-form-field>
 *
 * Nota: Este componente NAO usa OnPush para poder reagir a mudanças
 * imperativas no estado do controle (ex: serverError via setErrors()).
 */
@Component({
  selector: 'app-form-field',
  imports: [],
  template: `
    <div class="flex flex-col gap-2">
      @if (label()) {
        <label [for]="fieldId()" class="font-medium text-sm">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }

      <div class="form-field-input" [class.p-invalid]="showError()">
        <ng-content></ng-content>
      </div>

      @if (showError() && errorMessage()) {
        <small class="text-red-500 text-xs mt-1">{{ errorMessage() }}</small>
      }

      @if (hint() && !showError()) {
        <small class="text-gray-500 text-xs mt-1">{{ hint() }}</small>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .form-field-input {
      width: 100%;
    }

    .form-field-input ::ng-deep input,
    .form-field-input ::ng-deep textarea,
    .form-field-input ::ng-deep p-dropdown,
    .form-field-input ::ng-deep p-calendar,
    .form-field-input ::ng-deep p-inputnumber,
    .form-field-input ::ng-deep p-autocomplete {
      width: 100%;
    }

    .form-field-input.p-invalid ::ng-deep input,
    .form-field-input.p-invalid ::ng-deep textarea,
    .form-field-input.p-invalid ::ng-deep .p-inputtext {
      border-color: #e24c4c;
    }
  `]
})
export class FormFieldComponent {
  private readonly formValidation = inject(FormValidationService);

  // Inputs using new signal-based API
  readonly control = input<AbstractControl | null>(null);
  readonly label = input('');
  readonly required = input(false);
  readonly hint = input('');
  readonly fieldId = input('');

  /**
   * Determine if error should be shown
   */
  protected showError(): boolean {
    const ctrl = this.control();
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  /**
   * Get appropriate error message using centralized FormValidationService.
   * Suporta validadores nativos do Angular e erros do servidor (RFC 9457).
   * Nota: showError() já valida dirty/touched antes de chamar este método,
   * então desabilitamos a verificação de touched no service.
   */
  protected errorMessage(): string {
    return this.formValidation.getErrorMessage(
      this.control(),
      undefined,
      {checkTouched: false}
    );
  }
}
