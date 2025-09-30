import { Component, ElementRef, Injector, ViewChild } from "@angular/core";
import { CrudFormComponent } from "../framework/component/crud.form.component";
import { Reserva } from "./reserva";
import { ReservaService } from "./reserva.service";
import { ReservaItem } from "./reservaItem";
import {MatTable, MatTableModule} from "@angular/material/table";
import { Item } from "../item/item";
import { ItemService } from "../item/item.service";
import { pt } from "../framework/constantes/calendarPt";
import { DatePipe } from "@angular/common";
import { Usuario } from "../usuario/usuario";
import { ItemImage } from "../item/itemImage";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import {Carousel} from "primeng/carousel";
import {Dialog} from "primeng/dialog";
import {CancelarModule} from "../geral/cancelar/cancelar.module";
import {SalvarModule} from "../geral/salvar/salvar.module";
import {VoltarModule} from "../geral/voltar/voltar.module";
import {FormsModule} from "@angular/forms";
import {Card} from "primeng/card";
import {MatIconModule} from "@angular/material/icon";
import {AutoComplete} from "primeng/autocomplete";
import {CadastroRapidoModule} from "../geral/cadastroRapido/cadastroRapido.module";

@Component({
  selector: "app-form-reserva",
  templateUrl: "./reserva.form.component.html",
  styleUrls: ["./reserva.form.component.css"],
  imports: [
    Carousel,
    Dialog,
    CancelarModule,
    SalvarModule,
    VoltarModule,
    FormsModule,
    Card,
    MatTableModule,
    MatIconModule,
    AutoComplete,
    CadastroRapidoModule
  ]
})
export class ReservaFormComponent extends CrudFormComponent<Reserva, number> {
  @ViewChild("table") table: MatTable<any>;
  @ViewChild("itemToAdd") itemToAdd: ElementRef;
  @ViewChild("qtdeToAdd") qtdeToAdd: ElementRef;

  datepipe: DatePipe = new DatePipe("pt-BR");
  displayedColumns = ["item", "qtde", "actionsForm"];
  reservaItem: ReservaItem;
  itemList: Item[];
  localePt: any;
  images: ItemImage[];
  dialogImagens = false;
  minioUrl: string;
  responsiveOptions;

  constructor(
    protected reservaService: ReservaService,
    protected injector: Injector,
    private readonly itemService: ItemService
  ) {
    super(reservaService, injector, "/reserva");
    this.minioUrl = environment.minio_url;
    this.reservaItem = new ReservaItem();
    this.localePt = pt;
    this.responsiveOptions = [
      {
        breakpoint: "768px",
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: "560px",
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }

  initializeValues(): void {
    this.object.usuario = new Usuario();
    this.object.dataReserva = this.datepipe.transform(
      new Date().toLocaleDateString(),
      "dd/MM/yyyy"
    );
    this.setUsuarioResponsavel();
  }

  setUsuarioResponsavel() {
    this.loginService.getCurrentUser().subscribe((user) => {
      this.object.usuario = user;
    });
  }

  findProdutos($event) {
    this.itemService.completeItem($event.query, true).subscribe((e) => {
      this.itemList = e;
    });
  }

  removeItem(id: number) {
    let index;
    this.object.reservaItem.forEach((empItem) => {
      if (empItem.item.id === id) {
        index = this.object.reservaItem.indexOf(empItem);
      }
    });
    this.object.reservaItem.splice(index, 1);
    this.table.renderRows();
  }

  getQtdeTotal() {
    const valid = this?.object?.reservaItem;
    if (valid) {
      return this.object.reservaItem
        .map((t) => t.qtde)
        .reduce((acc, value) => Number(acc) + Number(value), 0);
    }
  }

  insertItem() {
    if (this.reservaItem.item && this.reservaItem.qtde) {
      if (this.saldoItemIsValid(this.reservaItem.qtde)) {
        if (!this.object.reservaItem) {
          this.object.reservaItem = new Array();
        }
        const upQtde = this.object.reservaItem.some(
          (value) => value.item.id === this.reservaItem.item.id
        );
        if (upQtde) {
          this.object.reservaItem.forEach((empItem) => {
            if (empItem.item.id === this.reservaItem.item.id) {
              const novaQtde =
                Number(empItem.qtde) + Number(this.reservaItem.qtde);
              if (this.saldoItemIsValid(novaQtde)) {
                empItem.qtde = novaQtde;
              }
            }
          });
        } else {
          this.object.reservaItem.push(this.reservaItem);
        }
        this.postInsertItemList();
      }
    } else {
      this.messageService.add({
        severity: "info",
        detail: "Necessário informar o item e a quantidade.",
      });
    }
  }

  postInsertItemList() {
    this.reservaItem = new ReservaItem();
    this.table.renderRows();
  }

  setFocusInputItem() {
    this.itemToAdd.nativeElement.focus();
  }

  setFocusQtdeToAdd() {
    this.qtdeToAdd.nativeElement.focus();
  }

  saldoItemIsValid(qtdeInserir) {
    const isValid =
      this.reservaItem.item.saldo > 0 &&
      qtdeInserir <= this.reservaItem.item.saldo;
    if (!isValid) {
      this.messageService.add({
        severity: "info",
        detail: "A quantidade é maior do que o saldo atual do item.",
      });
      return false;
    }
    return true;
  }

  save() {
    if (!this.object.reservaItem || this.object.reservaItem.length <= 0) {
      this.validExtra = false;
    } else {
      this.validExtra = true;
    }
    super.save();
  }

  showDialogImagens() {
    this.loaderService.show();
    console.log(this.reservaItem.item.imageItem[0]);
    this.itemService.findAllImagesItem(this.reservaItem.item.id)
      .subscribe(e => {
        this.loaderService.hide();
        if (e.length > 0) {
          this.images = e;
          this.dialogImagens = true;
        } else {
          Swal.fire('Ops...', 'Esse item não possui imagens.', 'info');
        }
      }, error => {
        this.loaderService.hide();
      });
  }
}
