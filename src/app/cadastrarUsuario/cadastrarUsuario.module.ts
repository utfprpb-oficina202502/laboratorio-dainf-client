import { NgModule } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ProgressBar } from "primeng/progressbar";
import { InputTextModule } from "primeng/inputtext";
import { CadastrarUsuarioComponent } from "./cadastrarUsuario.component";
import { CadastrarUsuarioService } from "./cadastrarUsuario.service";
import { ReenviarEmailConfirmacaoUsuarioComponent } from "./reenviarEmailConfirmacaoUsuario.component";
import { RecuperarSenhaComponent } from "./recuperarSenha.component";
import { ConfirmarEmailComponent } from "./confirmarEmail.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    ProgressBar,
    InputTextModule,
  ],
  declarations: [
    CadastrarUsuarioComponent,
    ReenviarEmailConfirmacaoUsuarioComponent,
    RecuperarSenhaComponent,
    ConfirmarEmailComponent,
  ],
  exports: [
    CadastrarUsuarioComponent,
    ReenviarEmailConfirmacaoUsuarioComponent,
    RecuperarSenhaComponent,
    ConfirmarEmailComponent,
  ],
  providers: [CadastrarUsuarioService],
})
export class CadastrarUsuarioModule {}
