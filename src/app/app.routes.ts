import {Routes} from '@angular/router';
import {LoginService} from './login/login.service';

// Components (only eager-loaded)
import {LoginComponent} from './login/login.component';
import {PageNotFoundComponent} from './pageNotFound/pageNotFound.component';
import {NotAuthorizedComponent} from './notAuthorized/notAuthorized.component';

// Form Components
import {GrupoFormComponent} from './grupo/grupo.form.component';
import {UsuarioFormComponent} from './usuario/usuario.form.component';
import {UsuarioEditComponent} from './usuario/usuario.edit.component';
import {FornecedorFormComponent} from './fornecedor/fornecedor.form.component';
import {ItemFormComponent} from './item/item.form.component';
import {ItemViewComponent} from './item/item.view.component';
import {CompraFormComponent} from './compra/compra.form.component';
import {EmprestimoFormComponent} from './emprestimo/emprestimo.form.component';
import {EmprestimoDevolucaoComponent} from './emprestimo/emprestimo.devolucao.component';
import {SaidaFormComponent} from './saida/saida.form.component';
import {ReservaFormComponent} from './reserva/reserva.form.component';
import {SolicitacaoCompraFormComponent} from './solicitacaoCompra/solicitacaoCompra.form.component';
import {RelatorioFormComponent} from './relatorio/relatorio.form.component';
import {RelatorioViewerComponent} from './relatorio/relatorio.viewer.component';
import {CadastrarUsuarioComponent} from './cadastrarUsuario/cadastrarUsuario.component';
import {
  ReenviarEmailConfirmacaoUsuarioComponent
} from './cadastrarUsuario/reenviarEmailConfirmacaoUsuario.component';
import {RecuperarSenhaComponent} from './cadastrarUsuario/recuperarSenha.component';
import {ConfirmarEmailComponent} from './cadastrarUsuario/confirmarEmail.component';

export const routes: Routes = [
  // Rotas públicas
  {path: 'login', component: LoginComponent},
  {path: 'cadastrar-usuario', component: CadastrarUsuarioComponent},
  {path: 'reenviar-email-confirmacao', component: ReenviarEmailConfirmacaoUsuarioComponent},
  {path: 'recupear-senha', component: RecuperarSenhaComponent},
  {path: 'recupear-senha/:code', component: RecuperarSenhaComponent},
  {path: 'confirmar-email/:code', component: ConfirmarEmailComponent},
  {
    path: '',
    canActivate: [LoginService],
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },

  // Grupo
  {
    path: 'grupo',
    canActivate: [LoginService],
    loadComponent: () => import('./grupo/grupo.list.component').then(m => m.GrupoListComponent)
  },
  {path: 'grupo/form', canActivate: [LoginService], component: GrupoFormComponent},
  {path: 'grupo/form/:id', canActivate: [LoginService], component: GrupoFormComponent},

  // Usuario
  {
    path: 'usuario',
    canActivate: [LoginService],
    loadComponent: () => import('./usuario/usuario.list.component').then(m => m.UsuarioListComponent)
  },
  {path: 'usuario/form', canActivate: [LoginService], component: UsuarioFormComponent},
  {path: 'usuario/form/:id', canActivate: [LoginService], component: UsuarioFormComponent},
  {path: 'usuario/edit/:id', canActivate: [LoginService], component: UsuarioEditComponent},

  // Fornecedor
  {
    path: 'fornecedor',
    canActivate: [LoginService],
    loadComponent: () => import('./fornecedor/fornecedor.list.component').then(m => m.FornecedorListComponent)
  },
  {path: 'fornecedor/form', canActivate: [LoginService], component: FornecedorFormComponent},
  {path: 'fornecedor/form/:id', canActivate: [LoginService], component: FornecedorFormComponent},

  // Item
  {
    path: 'item',
    canActivate: [LoginService],
    loadComponent: () => import('./item/item.list.component').then(m => m.ItemListComponent)
  },
  {path: 'item/form', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/form/:id', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/form/copy/:id', canActivate: [LoginService], component: ItemFormComponent},
  {path: 'item/view', canActivate: [LoginService], component: ItemViewComponent},

  // Compra
  {
    path: 'compra',
    canActivate: [LoginService],
    loadComponent: () => import('./compra/compra.list.component').then(m => m.CompraListComponent)
  },
  {path: 'compra/form', canActivate: [LoginService], component: CompraFormComponent},
  {path: 'compra/form/:id', canActivate: [LoginService], component: CompraFormComponent},

  // Emprestimo
  {
    path: 'emprestimo',
    canActivate: [LoginService],
    loadComponent: () => import('./emprestimo/emprestimo.list.component').then(m => m.EmprestimoListComponent)
  },
  {path: 'emprestimo/form', canActivate: [LoginService], component: EmprestimoFormComponent},
  {path: 'emprestimo/form/:id', canActivate: [LoginService], component: EmprestimoFormComponent},
  {
    path: 'emprestimo/form/reserva',
    canActivate: [LoginService],
    component: EmprestimoFormComponent
  },
  {
    path: 'emprestimo/devolucao/:id',
    canActivate: [LoginService],
    component: EmprestimoDevolucaoComponent
  },

  // Saida
  {
    path: 'saida',
    canActivate: [LoginService],
    loadComponent: () => import('./saida/saida.list.component').then(m => m.SaidaListComponent)
  },
  {path: 'saida/form', canActivate: [LoginService], component: SaidaFormComponent},
  {path: 'saida/form/:id', canActivate: [LoginService], component: SaidaFormComponent},

  // Reserva
  {
    path: 'reserva',
    canActivate: [LoginService],
    loadComponent: () => import('./reserva/reserva.list.component').then(m => m.ReservaListComponent)
  },
  {path: 'reserva/form', canActivate: [LoginService], component: ReservaFormComponent},
  {path: 'reserva/form/:id', canActivate: [LoginService], component: ReservaFormComponent},

  // Solicitacao Compra
  {
    path: 'solicitacao-compra',
    canActivate: [LoginService],
    loadComponent: () => import('./solicitacaoCompra/solicitacaoCompra.list.component').then(m => m.SolicitacaoCompraListComponent)
  },
  {
    path: 'solicitacao-compra/form',
    canActivate: [LoginService],
    component: SolicitacaoCompraFormComponent
  },
  {
    path: 'solicitacao-compra/form/:id',
    canActivate: [LoginService],
    component: SolicitacaoCompraFormComponent
  },

  // Relatorio
  {
    path: 'relatorio',
    canActivate: [LoginService],
    loadComponent: () => import('./relatorio/relatorio.list.component').then(m => m.RelatorioListComponent)
  },

  //Nada Consta
  {
    path: 'nada-consta',
    canActivate: [LoginService],
    loadComponent: () => import('./nada-consta/list/nada-consta-list.component').then(m => m.NadaConstaListComponent)
  },
  {
    path: 'nada-consta/consultar',
    canActivate: [LoginService],
    loadComponent: () => import('./nada-consta/nada-consta-visualizar.component').then(m => m.NadaConstaVisualizarComponent)
  },

  //relatório
  {path: 'relatorio/form', canActivate: [LoginService], component: RelatorioFormComponent},
  {path: 'relatorio/form/:id', canActivate: [LoginService], component: RelatorioFormComponent},
  {path: 'relatorio/view/:id', canActivate: [LoginService], component: RelatorioViewerComponent},

  // Configurações
  {
    path: 'configuracoes',
    canActivate: [LoginService],
    loadComponent: () => import('./configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent)
  },

  // Error pages
  {path: '403', component: NotAuthorizedComponent},
  {path: '**', component: PageNotFoundComponent}
];
