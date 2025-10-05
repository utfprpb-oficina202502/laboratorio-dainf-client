import {ActivatedRoute, Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {Directive, inject, OnInit} from '@angular/core';
import {MessageService} from 'primeng/api';
import {BaseFormComponent} from './base.form.component';
import Swal from 'sweetalert2';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';

@Directive()
export abstract class CrudFormComponent<T, ID> extends BaseFormComponent implements OnInit {
  // Abstract properties to be defined in child classes
  protected abstract service: CrudService<T, ID>;
  protected abstract urlList: string;
  protected abstract type?: new () => T;

  // Injected services
  protected readonly router: Router;
  protected readonly messageService: MessageService;
  protected readonly route: ActivatedRoute;
  protected readonly loaderService: LoaderService;
  protected readonly loginService: LoginService;

  // utilizado para validações extras
  public validExtra = true;
  public editando = false;
  public isAlunosOrProfessor = false;
  public object!: T;

  constructor() {
    super();
    this.router = inject(Router);
    this.route = inject(ActivatedRoute);
    this.messageService = inject(MessageService);
    this.loaderService = inject(LoaderService);
    this.loginService = inject(LoginService);
  }

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor()
      .then(value => this.isAlunosOrProfessor = value);
    this.newInstance();
    this.route.params.subscribe({
      next: (params) => {
        if (params.id) {
          if (!Number.isNaN(params.id)) {
            this.edit(params.id);
          }
        }
      }
    });
  }

  save() {
    this.loaderService.show();
    if (this.isValid() && this.validExtra) {
      this.service.save(this.object)
      .subscribe({
        next: (e) => {
          this.object = e;
          this.postSave((_value: any) => {
            this.loaderService.hide();
            Swal.fire('Sucesso!', 'Registro salvo com sucesso!', 'success');
            this.back();
          });
        },
        error: (error) => {
          this.loaderService.hide();
          Swal.fire('Atenção!', 'Ocorreu um erro ao salvar o registro!', 'error');
          console.log(error);
        }
        });
    } else {
      this.loaderService.hide();
      this.messageService.add({severity: 'info', summary: 'Atenção', detail: 'Necessário preencher todos os campos corretamente!'});
      this.validarFormulario();
    }
  }

  postSave(callback: Function): void {
    callback();
  }

  edit(id: ID) {
    this.loaderService.show();
    this.service.findOne(id)
    .subscribe({
      next: (e) => {
        this.object = e;
        this.editando = true;
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
        Swal.fire('Atenção!', 'Ocorreu um erro ao buscar o registro!', 'error');
      }
      });
  }

  back() {
    this.router.navigate([this.urlList]);
  }

  protected newInstance(): void {
    if (this.type) {
      this.object = new this.type();
    } else {
      this.object = {} as T;
    }
  }
}
