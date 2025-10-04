import {Component, inject, Injector, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NgForm} from '@angular/forms';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import {MenuItem} from 'primeng/api';
import {Menu, MenuModule} from 'primeng/menu';
import Swal from 'sweetalert2';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {TextareaModule} from 'primeng/textarea';
import {TagModule} from 'primeng/tag';

// Custom components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';

@Component({
    selector: 'app-devolucao-emprestimo',
    templateUrl: './emprestimo.devolucao.component.html',
    styleUrls: ['./emprestimo.devolucao.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    DialogModule,
    ScrollPanelModule,
    TextareaModule,
    MenuModule,
    TagModule,
    // Angular CDK
    DragDropModule,
    // Custom
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,

  ]
})
export class EmprestimoDevolucaoComponent extends CrudFormComponent<Emprestimo, number> {
  protected emprestimoService: EmprestimoService;
  protected injector: Injector;

  @ViewChild('form') frm: NgForm;
  @ViewChild('contextMenu') contextMenu: Menu;

  itensPendentes = [];
  itensDevolvidos = [];
  itensSaida = [];
  qtdeItemDuplicado: number;
  itemIsEditing: EmprestimoDevolucaoItem;
  dialogDuplicaItem = false;

  contextMenuPosition = {x: 0, y: 0};
  contextMenuItems: MenuItem[] = [];
  documentoUsuario: string;

  constructor() {
    const emprestimoService = inject(EmprestimoService);
    const injector = inject(Injector);

    super(emprestimoService, injector, '/emprestimo');

    this.emprestimoService = emprestimoService;
    this.injector = injector;
  }

  postEdit(): void {
    this.documentoUsuario = this.object.usuarioEmprestimo.documento;
    this.buildItensKanban();
  }

  buildItensKanban() {
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      switch (empDevItem.statusDevolucao) {
        case StatusDevolucao.P: {
          this.itensPendentes.push(empDevItem);
          break;
        }
        case StatusDevolucao.D: {
          this.itensDevolvidos.push(empDevItem);
          break;
        }
        case StatusDevolucao.S:
          this.itensSaida.push(empDevItem);
          break;
      }
    }
  }

  saveDevolucao() {
      this.loaderService.show();
      for (const empDevItem of this.object.emprestimoDevolucaoItem) {
        for (const pendente of this.itensPendentes) {
          if (empDevItem.id === pendente.id) {
            empDevItem.statusDevolucao = StatusDevolucao.P;
          }
        }
        for (const devolvido of this.itensDevolvidos) {
          if (empDevItem.id === devolvido.id) {
            empDevItem.statusDevolucao = StatusDevolucao.D;
          }
        }
        for (const saida of this.itensSaida) {
          if (empDevItem.id === saida.id) {
            empDevItem.statusDevolucao = StatusDevolucao.S;
          }
        }
      }
    this.emprestimoService.saveDevolucao(this.object)
        .subscribe(e => {
          this.loaderService.hide();
          Swal.fire('Sucesso!', 'Devolução efetuada com sucesso!', 'success');
          this.back();
        }, error => {
          this.loaderService.hide();
          Swal.fire('Atenção!', 'Ocorreu um erro ao salvar a devolução!', 'error');
        });
    //} else {
    //  Swal.fire('Atenção!', 'Ainda há ' + this.itensPendentes.length + ' itens pendentes para devolução!', 'error');
    //}
  }

  drop(event: CdkDragDrop<EmprestimoDevolucaoItem[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  duplicarItem() {
    if (!this.disableBtnSaveDuplicar()) {
      const itemDuplicado = structuredClone(this.itemIsEditing);
      itemDuplicado.qtde = this.qtdeItemDuplicado;
      itemDuplicado.id = null;
      this.itensPendentes.push(itemDuplicado);
      this.object.emprestimoDevolucaoItem.push(itemDuplicado);
      this.itemIsEditing.qtde = this.itemIsEditing.qtde - this.qtdeItemDuplicado;
      this.qtdeItemDuplicado = null;
      this.dialogDuplicaItem = false;
    }
  }

  verificaOptionsEnabled(item: EmprestimoDevolucaoItem): {canDuplicate: boolean, canRemoveDuplicates: boolean} {
    let count = 0;
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        count++;
      }
    }
    return {
      canDuplicate: count === 1,
      canRemoveDuplicates: count > 1
    };
  }

  openDialogDuplicarItem(item: EmprestimoDevolucaoItem) {
    this.dialogDuplicaItem = true;
    this.itemIsEditing = item;
  }

  onContextMenu(event: MouseEvent, item: EmprestimoDevolucaoItem) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    this.itemIsEditing = item;

    const options = this.verificaOptionsEnabled(item);

    this.contextMenuItems = [
      {
        label: 'Duplicar Item',
        icon: 'fa fa-copy',
        disabled: !options.canDuplicate,
        command: () => this.onClickMenuDuplicateItem(item)
      },
      {
        label: 'Remover Itens Duplicados',
        icon: 'fa fa-trash',
        disabled: !options.canRemoveDuplicates,
        command: () => this.onClickMenuRemoveDuplicates(item)
      }
    ];

    this.contextMenu?.show(event);
  }

  onClickMenuDuplicateItem(item: EmprestimoDevolucaoItem) {
    this.openDialogDuplicarItem(item);
  }

  onClickMenuRemoveDuplicates(item: EmprestimoDevolucaoItem) {
    this.removeItensDuplicadosByItem(item);
  }

  removeItensDuplicadosByItem(item: EmprestimoDevolucaoItem) {
    let qtdeTotal = 0;
    let empDetItemToRemove: EmprestimoDevolucaoItem;
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        qtdeTotal += Number(empDevItem.qtde);
      }
      if (empDevItem.id == null) {
        empDetItemToRemove = empDevItem;
      }
    }
    this.object.emprestimoDevolucaoItem.splice(this.object.emprestimoDevolucaoItem
      .indexOf(empDetItemToRemove), 1);
    this.itensPendentes.splice(this.itensPendentes.indexOf(empDetItemToRemove, 1));

    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        empDevItem.qtde = qtdeTotal;
      }
    }
  }

  disableBtnSaveDuplicar() {
    return this.qtdeItemDuplicado == null || this.qtdeItemDuplicado.toString() === ''
      || this.qtdeItemDuplicado >= this.itemIsEditing.qtde;
  }
}

