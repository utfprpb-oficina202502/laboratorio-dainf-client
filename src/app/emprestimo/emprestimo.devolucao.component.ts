import { Component, Injector, ViewChild, inject } from '@angular/core';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {MatTable} from '@angular/material/table';
import {NgForm} from '@angular/forms';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {MatMenuTrigger} from '@angular/material/menu';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-devolucao-emprestimo',
    templateUrl: './emprestimo.devolucao.component.html',
    styleUrls: ['./emprestimo.devolucao.component.css'],
    standalone: false
})
export class EmprestimoDevolucaoComponent extends CrudFormComponent<Emprestimo, number> {
  protected emprestimoService: EmprestimoService;
  protected injector: Injector;


  @ViewChild('form') frm: NgForm;
  @ViewChild('table') table: MatTable<any>;
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  itensPendentes = [];
  itensDevolvidos = [];
  itensSaida = [];
  qtdeItemDuplicado: number;
  itemIsEditing: EmprestimoDevolucaoItem;
  dialogDuplicaItem = false;

  contextMenuPosition = {x: '0px', y: '0px'};
  optionDuplicateDisable = false;
  optionRemoveDuplicateDisable = false;
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

  verificaOptionsEnabled(item: EmprestimoDevolucaoItem) {
    let count = 0;
    for (const empDevItem of this.object.emprestimoDevolucaoItem) {
      if (empDevItem.item.id === item.item.id) {
        count++;
      }
    }
    if (count === 1) {
      this.optionDuplicateDisable = false;
      this.optionRemoveDuplicateDisable = true;
    } else {
      this.optionDuplicateDisable = true;
      this.optionRemoveDuplicateDisable = false;
    }
  }

  openDialogDuplicarItem(item: EmprestimoDevolucaoItem) {
    this.dialogDuplicaItem = true;
    this.itemIsEditing = item;
  }

  onContextMenu(event: MouseEvent, item: EmprestimoDevolucaoItem) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = {item};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
    this.verificaOptionsEnabled(item);
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

