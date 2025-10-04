import {Component, inject, Injector, ViewChild} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, NgForm} from "@angular/forms";
import {Usuario} from "./usuario";
import {UsuarioService} from "./usuario.service";
import {CrudFormComponent} from "../framework/component/crud.form.component";
import {SelectItem} from "primeng/api";
import Swal from "sweetalert2";

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {MultiSelectModule} from 'primeng/multiselect';
import {PasswordModule} from 'primeng/password';
import {InputMaskModule} from 'primeng/inputmask';

// Custom components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';

@Component({
    selector: "app-edit-usuario",
    templateUrl: "./usuario.edit.component.html",
    styleUrls: ["./usuario.edit.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    MultiSelectModule,
    PasswordModule,
    InputMaskModule,
    // Custom
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ]
})
export class UsuarioEditComponent extends CrudFormComponent<Usuario, number> {
  protected usuarioService: UsuarioService;
  protected injector: Injector;

  @ViewChild("form", { static: true }) frm: NgForm;
  @ViewChild("formChangeSenha", { static: true }) formChangeSenha: NgForm;
  grupoAcessoDropdown: SelectItem[];
  dialogChangeSenha = false;
  redSenhaAtual: string;
  redConfNovaSenha: string;
  redNovaSenha: string;

  constructor() {
    const usuarioService = inject(UsuarioService);
    const injector = inject(Injector);

    super(usuarioService, injector, "/usuario");
    this.usuarioService = usuarioService;
    this.injector = injector;

    this.buildGrupoDeAcesso();
  }

  buildGrupoDeAcesso() {
    this.usuarioService.findAllPermissao().subscribe((e) => {
      this.grupoAcessoDropdown = new Array();
      if (e != null) {
        e.forEach((permissao) => {
          this.grupoAcessoDropdown.push({
            label: this.formatRule(permissao.nome),
            value: permissao,
          });
        });
        if (!this.editando) {
          this.object.permissoes = [];
          this.object.permissoes.push(e[0]);
        }
      }
    });
  }

  formatRule(nome) {
    let toReturn = nome.replace("ROLE_", "");
    toReturn =
      toReturn.charAt(0).toUpperCase() + toReturn.slice(1).toLowerCase();
    return toReturn;
  }

  showDialogChangeSenha() {
    this.dialogChangeSenha = true;
  }

  redefinirSenha() {
    if (this.formChangeSenha.valid) {
      if (this.redNovaSenha === this.redConfNovaSenha) {
        this.object.password = this.redNovaSenha;
        this.usuarioService
        .changeSenha(this.object, this.redSenhaAtual)
        .subscribe(
          (e) => {
            this.messageService.add({
              severity: "success",
              summary: "Sucesso",
              detail: "Senha redefinida com sucesso!",
            });
            this.formChangeSenha.reset();
            this.dialogChangeSenha = false;
          },
          (error) => {
            this.messageService.add({
              severity: "error",
              summary: "Atenção",
              detail: "A senha atual está incorreta!",
            });
          }
        );
      } else {
        this.messageService.add({
          severity: "error",
          summary: "Atenção",
          detail: "Senhas não conferem!",
        });
      }
    } else {
      this.validarFormulario(this.formChangeSenha);
    }
  }

  updateUser() {
    this.loaderService.show();
    if (this.isValid() && this.validExtra) {
      this.usuarioService.updateUser(this.object).subscribe({
        next: (e) => {
          localStorage.setItem("userLogged", JSON.stringify(this.object));
          this.loaderService.hide();
          Swal.fire("Sucesso!", "Registro salvo com sucesso!", "success");
        },
        error: (error) => {
          this.loaderService.hide();
          Swal.fire(
            "Atenção!",
            "Ocorreu um erro ao salvar o registro!",
            "error"
          );
        },
      });
    } else {
      this.loaderService.hide();
      this.messageService.add({
        severity: "info",
        summary: "Atenção",
        detail: "Necessário preencher todos os campos corretamente!",
      });
      this.validarFormulario();
    }
  }
}
