import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {GrupoFormComponent} from './grupo/grupo.form.component';
import {UsuarioFormComponent} from './usuario/usuario.form.component';
import {FornecedorFormComponent} from './fornecedor/fornecedor.form.component';
import {EstadoFormComponent} from './estado/estado.form.component';
import {PaisFormComponent} from './pais/pais.form.component';
import {CidadeFormComponent} from './cidade/cidade.form.component';
import {ItemFormComponent} from './item/item.form.component';
import {PageNotFoundComponent} from './pageNotFound/pageNotFound.component';
import {CompraFormComponent} from './compra/compra.form.component';
import {LoginComponent} from './login/login.component';
import {LoginService} from './login/login.service';
import {EmprestimoFormComponent} from './emprestimo/emprestimo.form.component';
import {SaidaFormComponent} from './saida/saida.form.component';
import {EmprestimoDevolucaoComponent} from './emprestimo/emprestimo.devolucao.component';
import {ReservaFormComponent} from './reserva/reserva.form.component';
import {SolicitacaoCompraFormComponent} from './solicitacaoCompra/solicitacaoCompra.form.component';
import {NotAuthorizedComponent} from './notAuthorized/notAuthorized.component';
import {RelatorioFormComponent} from './relatorio/relatorio.form.component';
import {RelatorioViewerComponent} from './relatorio/relatorio.viewer.component';
import { UsuarioEditComponent } from './usuario/usuario.edit.component';
import { CadastrarUsuarioComponent } from './cadastrarUsuario/cadastrarUsuario.component';
import { ReenviarEmailConfirmacaoUsuarioComponent } from './cadastrarUsuario/reenviarEmailConfirmacaoUsuario.component';
import { RecuperarSenhaComponent } from './cadastrarUsuario/recuperarSenha.component';
import { ConfirmarEmailComponent } from './cadastrarUsuario/confirmarEmail.component';
import { ItemViewComponent } from './item/item.view.component';

const routes: Routes = [
  // Rotas públicas
  {path: 'login', component: LoginComponent},
  {path: 'cadastrar-usuario', component: CadastrarUsuarioComponent},
  {path: 'reenviar-email-confirmacao', component: ReenviarEmailConfirmacaoUsuarioComponent},
  {path: 'recupear-senha', component: RecuperarSenhaComponent},
  {path: 'recupear-senha/:code', component: RecuperarSenhaComponent},
  {path: 'confirmar-email/:code', component: ConfirmarEmailComponent},
  {path: '', canActivate: [LoginService], component: HomeComponent},

  {
    path: 'grupo',
    canActivate: [LoginService],
    loadComponent: () => import('./grupo/grupo.list.component').then(m => m.GrupoListComponent)
  },
  {path: 'grupo/form', canActivate: [LoginService], component: GrupoFormComponent},
  {path: 'grupo/form/:id', canActivate: [LoginService], component: GrupoFormComponent},

  {
    path: 'usuario',
    canActivate: [LoginService],
    loadComponent: () => import('./usuario/usuario.list.component').then(m => m.UsuarioListComponent)
  },
  {path: 'usuario/form', canActivate: [LoginService], component: UsuarioFormComponent},
  {path: 'usuario/form/:id', canActivate: [LoginService], component: UsuarioFormComponent},
  {path: 'usuario/edit/:id', canActivate: [LoginService], component: UsuarioEditComponent},

  {
    path: 'fornecedor',
    canActivate: [LoginService],
    loadComponent: () => import('./fornecedor/fornecedor.list.component').then(m => m.FornecedorListComponent)
  },
  {path: 'fornecedor/form', canActivate: [LoginService], component: FornecedorFormComponent},
  {path: 'fornecedor/form/:id', canActivate: [LoginService], component: FornecedorFormComponent},

  {
    path: 'estado',
    canActivate: [LoginService],
    loadComponent: () => import('./estado/estado.list.component').then(m => m.EstadoListComponent)
  },
  {path: 'estado/form', canActivate: [LoginService], component: EstadoFormComponent},
  {path: 'estado/form/:id', canActivate: [LoginService], component: EstadoFormComponent},

  {
    path: 'pais',
    canActivate: [LoginService],
    loadComponent: () => import('./pais/pais.list.component').then(m => m.PaisListComponent)
  },
  {path: 'pais/form', canActivate: [LoginService], component: PaisFormComponent},
  {path: 'pais/form/:id', canActivate: [LoginService], component: PaisFormComponent},

  {
    path: 'cidade',
    canActivate: [LoginService],
    loadComponent: () => import('./cidade/cidade.list.component').then(m => m.CidadeListComponent)
  },
  {path: 'cidade/form', canActivate: [LoginService], component: CidadeFormComponent},
  {path: 'cidade/form/:id', canActivate: [LoginService], component: CidadeFormComponent},

  {
    path: 'item',
    canActivate: [LoginService],
    loadComponent: () => import('./item/item.list.component').then(m => m.ItemListComponent)
  },
  {path: 'item/form', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/form/:id', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/form/copy/:id', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/view', canActivate: [LoginService], component: ItemViewComponent},

  {
    path: 'compra',
    canActivate: [LoginService],
    loadComponent: () => import('./compra/compra.list.component').then(m => m.CompraListComponent)
  },
  {path: 'compra/form', canActivate: [LoginService], component: CompraFormComponent},
  {path: 'compra/form/:id', canActivate: [LoginService], component: CompraFormComponent},

  {
    path: 'emprestimo',
    canActivate: [LoginService],
    loadComponent: () => import('./emprestimo/emprestimo.list.component').then(m => m.EmprestimoListComponent)
  },
  {path: 'emprestimo/form', canActivate: [LoginService], component: EmprestimoFormComponent},
  {path: 'emprestimo/form/:id', canActivate: [LoginService], component: EmprestimoFormComponent},
  {path: 'emprestimo/form/reserva', canActivate: [LoginService], component: EmprestimoFormComponent},
  {path: 'emprestimo/devolucao/:id', canActivate: [LoginService], component: EmprestimoDevolucaoComponent},

  {
    path: 'saida',
    canActivate: [LoginService],
    loadComponent: () => import('./saida/saida.list.component').then(m => m.SaidaListComponent)
  },
  {path: 'saida/form', canActivate: [LoginService], component: SaidaFormComponent},
  {path: 'saida/form/:id', canActivate: [LoginService], component: SaidaFormComponent},

  {
    path: 'reserva',
    canActivate: [LoginService],
    loadComponent: () => import('./reserva/reserva.list.component').then(m => m.ReservaListComponent)
  },
  {path: 'reserva/form', canActivate: [LoginService], component: ReservaFormComponent},
  {path: 'reserva/form/:id', canActivate: [LoginService], component: ReservaFormComponent},

  {
    path: 'solicitacao-compra',
    canActivate: [LoginService],
    loadComponent: () => import('./solicitacaoCompra/solicitacaoCompra.list.component').then(m => m.SolicitacaoCompraListComponent)
  },
  {path: 'solicitacao-compra/form', canActivate: [LoginService], component: SolicitacaoCompraFormComponent},
  {path: 'solicitacao-compra/form/:id', canActivate: [LoginService], component: SolicitacaoCompraFormComponent},

  {
    path: 'relatorio',
    canActivate: [LoginService],
    loadComponent: () => import('./relatorio/relatorio.list.component').then(m => m.RelatorioListComponent)
  },
  {path: 'relatorio/form', canActivate: [LoginService], component: RelatorioFormComponent},
  {path: 'relatorio/form/:id', canActivate: [LoginService], component: RelatorioFormComponent},
  {path: 'relatorio/view/:id', canActivate: [LoginService], component: RelatorioViewerComponent},

  {path: '403', component: NotAuthorizedComponent},
  {path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
