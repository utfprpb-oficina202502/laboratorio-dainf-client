import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../service/crud.service';
import { Directive, Injector, OnInit, signal, computed } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { LoaderService } from '../loader/loader.service';
import { LoginService } from '../../login/login.service';

@Directive()
export abstract class PrimeReactiveCrudFormComponent<T, ID> implements OnInit {
  protected router: Router;
  protected messageService: MessageService;
  protected route: ActivatedRoute;
  protected loaderService: LoaderService;
  protected loginService: LoginService;

  protected readonly isEditing = signal(false);
  protected readonly isAlunoOrProfessor = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly object = signal<T | null>(null);

  protected readonly isFormValid = computed(() => this.form()?.valid ?? false);
  protected readonly isFormDirty = computed(() => this.form()?.dirty ?? false);
  protected readonly isFormTouched = computed(() => this.form()?.touched ?? false);

  protected readonly form = signal<FormGroup | null>(null);
  protected validExtra = true;

  protected constructor(
    protected service: CrudService<T, ID>,
    protected injector: Injector,
    protected urlList: string,
    private readonly type?: new () => T
  ) {
    this.router = this.injector.get(Router);
    this.route = this.injector.get(ActivatedRoute);
    this.messageService = this.injector.get(MessageService);
    this.loaderService = this.injector.get(LoaderService);
    this.loginService = this.injector.get(LoginService);
  }

  protected abstract buildForm(): FormGroup;

  ngOnInit(): void {
    this.loginService
      .userLoggedIsAlunoOrProfessor()
      .then((value) => this.isAlunoOrProfessor.set(value));

    this.newInstance();
    this.form.set(this.buildForm());
    this.preOnInit();

    this.route.params.subscribe((params) => {
      if (params.id) {
        if (Number.isNaN(params.id)) {
          this.initializeValues();
        } else {
          this.edit(params.id);
        }
      } else {
        this.initializeValues();
      }
    });
  }

  save(): void {
    this.loaderService.show();
    this.isLoading.set(true);

    const formGroup = this.form();
    if (!formGroup) {
      this.loaderService.hide();
      this.isLoading.set(false);
      return;
    }

    if (formGroup.valid && this.validExtra) {
      const formValue = this.prepareFormValue(formGroup.value);
      const objectToSave = this.mergeWithObject(formValue);

      this.service.save(objectToSave).subscribe({
        next: (savedObject) => {
          this.object.set(savedObject);
          this.postSave(() => {
            this.loaderService.hide();
            this.isLoading.set(false);
            Swal.fire('Sucesso!', 'Registro salvo com sucesso!', 'success');
            this.back();
          });
        },
        error: (error) => {
          this.loaderService.hide();
          this.isLoading.set(false);
          Swal.fire('Atenção!', 'Ocorreu um erro ao salvar o registro!', 'error');
          console.error(error);
        },
      });
    } else {
      this.loaderService.hide();
      this.isLoading.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!',
      });
      this.markFormAsTouched(formGroup);
    }
  }

  edit(id: ID): void {
    this.loaderService.show();
    this.isLoading.set(true);

    this.service.findOne(id).subscribe({
      next: (object) => {
        this.object.set(object);
        this.isEditing.set(true);
        this.patchFormWithObject(object);
        this.postEdit();
        this.loaderService.hide();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loaderService.hide();
        this.isLoading.set(false);
        Swal.fire('Atenção!', 'Ocorreu um erro ao buscar o registro!', 'error');
        console.error(error);
      },
    });
  }

  back(): void {
    this.router.navigate([this.urlList]);
  }

  getErrorMessage(controlName: string): string {
    const formGroup = this.form();
    if (!formGroup) return '';

    const control = formGroup.get(controlName);
    if (!control?.errors || !control?.touched) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['minlength'])
      return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo de ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['email']) return 'E-mail inválido';
    if (errors['pattern']) return 'Formato inválido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;

    return 'Campo inválido';
  }

  hasError(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  isValidField(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return !!(control && control.valid && control.touched);
  }

  protected markFormAsTouched(formGroup: FormGroup): void {
    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormAsTouched(control);
      }
    }
  }

  protected patchFormWithObject(object: T): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue(object as any);
    }
  }

  protected prepareFormValue(formValue: any): any {
    return formValue;
  }

  protected mergeWithObject(formValue: any): T {
    const currentObject = this.object();
    return { ...currentObject, ...formValue } as T;
  }

  protected newInstance(): void {
    if (this.type) {
      this.object.set(new this.type());
    } else {
      this.object.set({} as T);
    }
  }

  protected initializeValues(): void {}
  protected preOnInit(): void {}
  protected postEdit(): void {}
  protected postSave(callback: Function): void {
    callback();
  }
}
