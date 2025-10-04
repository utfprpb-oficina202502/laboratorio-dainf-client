import { FormControl, NgForm } from '@angular/forms';
import { ViewChild, Directive } from '@angular/core';

@Directive()
export abstract class BaseFormComponent {

  @ViewChild(NgForm)
  public form: NgForm;

  validarFormulario(form?: NgForm): void {
    if (!form) {
      form = this.form;
    }

    // Mark all controls as dirty and update validity
    for (const eachControl in form.controls) {
      (form.controls[eachControl] as FormControl).markAsDirty();
      (form.controls[eachControl] as FormControl).updateValueAndValidity();
    }

    setTimeout(() => {
      const tabsElement = document.querySelector('p-tabs');
      if (!tabsElement) return;

      const firstInvalidElement = tabsElement.querySelector('.ng-invalid');
      if (!firstInvalidElement) return;

      let tabPanel = firstInvalidElement.closest('p-tab');
      if (!tabPanel) return;

      const allTabPanels = Array.from(tabsElement.querySelectorAll('p-tab'));
      const tabIndex = allTabPanels.indexOf(tabPanel);

      if (tabIndex === -1) return;

      const tabHeaders = tabsElement.querySelectorAll('.p-tabview-nav li, .ui-tabview-nav li');
      if (tabHeaders[tabIndex]) {
        (tabHeaders[tabIndex] as HTMLElement).click();
      }
    }, 0);
  }

  isValid(): boolean {
    return this.form.valid;
  }
}
