import {Component, ElementRef, Injector, ViewChild} from '@angular/core';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {SolicitacaoCompraItem} from './solicitacaoCompraItem';
import {
  MatCell, MatCellDef,
  MatFooterCell, MatFooterCellDef,
  MatFooterRow, MatFooterRowDef,
  MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {ItemService} from '../item/item.service';
import {Item} from '../item/item';
import {pt} from '../framework/constantes/calendarPt';
import { DatePipe } from '@angular/common';
import {SalvarModule} from "../geral/salvar/salvar.module";
import {CancelarModule} from "../geral/cancelar/cancelar.module";
import {FormsModule} from "@angular/forms";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";
import {VoltarModule} from "../geral/voltar/voltar.module";
import {MatIconModule} from "@angular/material/icon";
import {AutoComplete} from "primeng/autocomplete";
import {CadastroRapidoModule} from "../geral/cadastroRapido/cadastroRapido.module";

@Component({
  selector: 'app-form-solicitacao-compra',
  templateUrl: './solicitacaoCompra.form.component.html',
  styleUrls: ['./solicitacaoCompra.form.component.css'],
  imports: [
    MatCell,
    MatHeaderCell,
    MatFooterCell,
    SalvarModule,
    CancelarModule,
    FormsModule,
    MatCardContent,
    VoltarModule,
    MatCardTitle,
    MatCard,
    MatFooterRow,
    MatRow,
    MatHeaderRow,
    MatFooterRowDef,
    MatRowDef,
    MatHeaderRowDef,
    MatTable,
    MatIconModule,
    AutoComplete,
    CadastroRapidoModule,
    MatHeaderCellDef,
    MatCellDef,
    MatFooterCellDef
  ]
})
export class SolicitacaoCompraFormComponent extends CrudFormComponent<SolicitacaoCompra, number> {

  @ViewChild('table') table: MatTable<any>;
  @ViewChild('itemToAdd') itemToAdd: ElementRef;
  @ViewChild('qtdeToAdd') qtdeToAdd: ElementRef;
  datepipe: DatePipe = new DatePipe('pt-BR');
  displayedColumns = ['item', 'qtde', 'actionsForm'];
  solicitacaoCompraItem: SolicitacaoCompraItem;
  itemList: Item[];
  localePt: any;

  constructor(protected solicitacaoCompraService: SolicitacaoCompraService,
              protected injector: Injector,
              private readonly itemService: ItemService) {
    super(solicitacaoCompraService, injector, '/solicitacao-compra');
    this.localePt = pt;
    this.solicitacaoCompraItem = new SolicitacaoCompraItem();
  }

  initializeValues(): void {
    this.object.dataSolicitacao = this.datepipe.transform(new Date(), 'dd/MM/yyyy');
    this.setUsuarioResponsavel();
  }

  setUsuarioResponsavel() {
    this.loginService.getCurrentUser().subscribe((user) => {
      this.object.usuario = user;
    });
  }

  findProdutos($event) {
    this.itemService.completeItem($event.query, false)
      .subscribe(e => {
        this.itemList = e;
      });
  }

  removeItem(id: number) {
    let index;
    this.object.solicitacaoItem.forEach(empItem => {
      if (empItem.item.id === id) {
        index = this.object.solicitacaoItem.indexOf(empItem);
      }
    });
    this.object.solicitacaoItem.splice(index, 1);
    this.table.renderRows();
  }

  getQtdeTotal() {
    const valid = this?.object?.solicitacaoItem;
    if (valid) {
      return this.object.solicitacaoItem.map(t => t.qtde).reduce((acc, value) => Number(acc) + Number(value), 0);
    }
  }

  insertItem() {
    if (this.solicitacaoCompraItem.item && this.solicitacaoCompraItem.qtde) {
      if (!this.object.solicitacaoItem) {
        this.object.solicitacaoItem = new Array();
      }
      const upQtde = this.object.solicitacaoItem.some(value => value.item.id === this.solicitacaoCompraItem.item.id);
      if (upQtde) {
        this.object.solicitacaoItem.forEach(empItem => {
          if (empItem.item.id === this.solicitacaoCompraItem.item.id) {
            const novaQtde = Number(empItem.qtde) + Number(this.solicitacaoCompraItem.qtde);
            empItem.qtde = novaQtde;
          }
        });
      } else {
        this.object.solicitacaoItem.push(this.solicitacaoCompraItem);
      }
      this.postInsertItemList();
    } else {
      this.messageService.add({severity: 'info', detail: 'Necessário informar o item e a quantidade.'});
    }
  }

  postInsertItemList() {
    this.solicitacaoCompraItem = new SolicitacaoCompraItem();
    this.setFocusInputItem();
    this.table.renderRows();
  }

  setFocusInputItem() {
    this.itemToAdd.nativeElement.focus();
  }

  setFocusQtdeToAdd() {
    this.qtdeToAdd.nativeElement.focus();
  }
}
