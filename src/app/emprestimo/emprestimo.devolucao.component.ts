import {Component, inject, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NgForm} from '@angular/forms';
import {Z_INDEX} from '../framework/constants';
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
import {BreakpointService} from '../framework/services/breakpoint.service';

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
  protected override service = inject(EmprestimoService);
  protected override urlList = '/emprestimo';
  protected override type = undefined;
  protected readonly breakpointService = inject(BreakpointService);

  readonly frm = viewChild.required<NgForm>('form');
  readonly contextMenu = viewChild<Menu>('contextMenu');

  itensPendentes: EmprestimoDevolucaoItem[] = [];
  itensDevolvidos: EmprestimoDevolucaoItem[] = [];
  itensSaida: EmprestimoDevolucaoItem[] = [];
  qtdeItemDuplicado: number | undefined;
  itemIsEditing!: EmprestimoDevolucaoItem;
  dialogDuplicaItem = false;

  contextMenuPosition = {x: 0, y: 0};
  contextMenuItems: MenuItem[] = [];
  documentoUsuario!: string;

  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  constructor() {
    super();
  }

  // Getter for backwards compatibility
  protected get emprestimoService(): EmprestimoService {
    return this.service;
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
    this.atualizarStatusItens();
    this.emprestimoService.saveDevolucao(this.object)
    .subscribe({
      next: () => {
        this.loaderService.hide();
        Swal.fire('Sucesso!', 'Devolução efetuada com sucesso!', 'success');
        this.back();
      },
      error: () => {
        this.loaderService.hide();
        Swal.fire('Atenção!', 'Ocorreu um erro ao salvar a devolução!', 'error');
      }
    });
  }

  duplicarItem() {
    if (!this.disableBtnSaveDuplicar() && this.qtdeItemDuplicado !== null && this.qtdeItemDuplicado !== undefined) {
      const itemDuplicado = structuredClone(this.itemIsEditing);
      itemDuplicado.qtde = this.qtdeItemDuplicado;
      itemDuplicado.id = 0;
      this.itensPendentes.push(itemDuplicado);
      this.object.emprestimoDevolucaoItem.push(itemDuplicado);
      this.itemIsEditing.qtde = this.itemIsEditing.qtde - this.qtdeItemDuplicado;
      this.qtdeItemDuplicado = undefined;
      this.dialogDuplicaItem = false;
    }
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
        icon: 'pi pi-copy',
        disabled: !options.canDuplicate,
        command: () => this.onClickMenuDuplicateItem(item)
      },
      {
        label: 'Remover Itens Duplicados',
        icon: 'pi pi-trash',
        disabled: !options.canRemoveDuplicates,
        command: () => this.onClickMenuRemoveDuplicates(item)
      }
    ];

    this.contextMenu()?.show(event);
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

  removeItensDuplicadosByItem(item: EmprestimoDevolucaoItem) {
    let qtdeTotal = 0;
    let empDetItemToRemove: EmprestimoDevolucaoItem | undefined;
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        qtdeTotal += Number(empDevItem.qtde);
      }
      if (empDevItem.id === null) {
        empDetItemToRemove = empDevItem;
      }
    }
    if (empDetItemToRemove) {
      this.object.emprestimoDevolucaoItem.splice(this.object.emprestimoDevolucaoItem
      .indexOf(empDetItemToRemove), 1);
      this.itensPendentes.splice(this.itensPendentes.indexOf(empDetItemToRemove), 1);

      // Early exit: para após atualizar o primeiro item encontrado
      for (const empDevItem of this.object.emprestimoDevolucaoItem) {
        if (empDevItem.item.id === item.item.id) {
          empDevItem.qtde = qtdeTotal;
          break; // Sai após atualizar quantidade
        }
      }
    }
  }

  verificaOptionsEnabled(item: EmprestimoDevolucaoItem): {
    canDuplicate: boolean,
    canRemoveDuplicates: boolean
  } {
    let count = 0;
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        count++;
        // Early exit: se já tem 2+, não precisa continuar contando
        if (count > 1) {
          break;
        }
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

  disableBtnSaveDuplicar() {
    return this.qtdeItemDuplicado === null || this.qtdeItemDuplicado === undefined
      || this.qtdeItemDuplicado.toString() === ''
      || this.qtdeItemDuplicado >= this.itemIsEditing.qtde;
  }

  onClickMenuDuplicateItem(item: EmprestimoDevolucaoItem) {
    this.openDialogDuplicarItem(item);
  }

  onClickMenuRemoveDuplicates(item: EmprestimoDevolucaoItem) {
    this.removeItensDuplicadosByItem(item);
  }

  /**
   * Atualiza o status de devolução dos itens com base nas listas de kanban
   */
  private atualizarStatusItens(): void {
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      this.atualizarStatusSePresente(empDevItem, this.itensPendentes, StatusDevolucao.P);
      this.atualizarStatusSePresente(empDevItem, this.itensDevolvidos, StatusDevolucao.D);
      this.atualizarStatusSePresente(empDevItem, this.itensSaida, StatusDevolucao.S);
    }
  }

  /**
   * Atualiza o status do item se ele estiver presente na lista fornecida
   */
  private atualizarStatusSePresente(
    empDevItem: EmprestimoDevolucaoItem,
    lista: EmprestimoDevolucaoItem[],
    status: StatusDevolucao
  ): void {
    if (lista.some(item => item.id === empDevItem.id)) {
      empDevItem.statusDevolucao = status;
    }
  }
}

