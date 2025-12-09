import {Directive, forwardRef} from '@angular/core';
import {FormControl, NG_VALIDATORS, Validator} from '@angular/forms';
import {StringUtils} from '../../utils/string.utils';
import {EmailUtil} from '../../utils/email.util';

@Directive({
  selector: '[appValidateEmail][ngModel],[appValidateEmail][formControl]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => EmailValidatorDirective), multi: true }
    ],
})
export class EmailValidatorDirective implements Validator {

  validator: (c: FormControl) => { validateEmail: { valid: boolean } } | null;

  constructor() {
    this.validator = validateEmail();
  }

  validate(c: FormControl) {
    return this.validator(c);
  }

}

function validateEmail() {
  return (c: FormControl) => {
    const valor = c.value;
    if (StringUtils.isNotBlank(valor)) {
      const email = valor.toString();

      let valid = true;
      if (!EmailUtil.isValid(email)) {
        valid = false;
      }

      if (valid) {
        return null;
      }
    }

    return {
      validateEmail: {
        valid: false
      }
    };
  };
}

