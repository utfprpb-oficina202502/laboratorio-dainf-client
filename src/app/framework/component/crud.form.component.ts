import {ActivatedRoute, Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {Directive, inject, OnInit} from '@angular/core';
import {MessageService} from 'primeng/api';
import {BaseFormComponent} from './base.form.component';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {LoggerService} from '../services/logger.service';
import {extractRouteParam, parseNumericId} from '../utils/route-params.operators';

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
  protected readonly logger: LoggerService;

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
    this.logger = inject(LoggerService);
  }

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor()
      .then(value => this.isAlunosOrProfessor = value);
    this.newInstance();
    // Extração e validação de parâmetro ID com operator utilitário
    this.route.params.pipe(
      extractRouteParam({
        paramName: 'id',
        converter: parseNumericId,
        onError: (value) => {
          this.logger.warn(`Invalid ID parameter: ${value}`);
          this.back();
        }
      })
    ).subscribe({
      next: (id) => {
        if (id !== null) {
          this.edit(id as ID);
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
          this.postSave(() => {
            this.loaderService.hide();
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: 'Registro salvo com sucesso!',
              life: 3000
            });
            this.back();
          });
        },
        error: (error) => {
          this.loaderService.hide();
          this.messageService.add({
            severity: 'error',
            summary: 'Atenção!',
            detail: 'Ocorreu um erro ao salvar o registro!',
            life: 5000
          });
          this.logger.error('Error saving record', error);
        }
        });
    } else {
      this.loaderService.hide();
      this.messageService.add({severity: 'info', summary: 'Atenção', detail: 'Necessário preencher todos os campos corretamente!'});
      this.validarFormulario();
    }
  }

  postSave(callback: () => void): void {
    callback();
  }

  edit(id: ID) {
    this.loaderService.show();
    this.service.findOne(id)
    .subscribe({
      next: (e) => {
        this.object = e;
        this.editando = true;
        this.postEdit();
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao buscar o registro!',
          life: 5000
        });
      }
      });
  }

  protected postEdit(): void {
    // Hook para lógica customizada após carregar entidade na edição
    // Child classes podem sobrescrever para executar ações adicionais
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
