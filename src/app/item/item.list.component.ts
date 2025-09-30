import { Component, forwardRef, Injector, ChangeDetectionStrategy } from "@angular/core";
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { Item } from "./item";
import { ItemService } from "./item.service";
import { PrimeCrudListComponent } from "../framework/component/prime-crud.list.component";
import { TableColumn } from '../framework/model/table-config.interface';
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { BottomSheetItemComponent } from "./bottomScheetItem/bottomSheetItem.component";
import { ReservaService } from "../reserva/reserva.service";
import Swal from "sweetalert2";
import { Reserva } from "../reserva/reserva";
import { environment } from "src/environments/environment";

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {MultiSelectModule} from 'primeng/multiselect';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {DialogModule} from 'primeng/dialog';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {NovoModule} from '../geral/novo/novo.module';

@Component({
    selector: "app-list-item",
    templateUrl: "./item.list.component.html",
    styleUrls: ["./item.list.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    MultiSelectModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule,
    DialogModule,
    PrimeCrudToolbarComponent,
    NovoModule,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => ItemListComponent) }]
})
export class ItemListComponent extends PrimeCrudListComponent<Item, number> {
  isAlunoOrProfessor = false;
  reservasItem: Reserva[];
  dialogReservaitem = false;
  displayedColumnsReserva = ["dataRetirada", "qtde"];
  minioUrl: string;

  private readonly tableColumns: TableColumn[] = [
    {
      field: 'id',
      header: '#',
      type: 'number',
      sortable: true,
      filterable: true,
      width: '6rem',
      align: 'center'
    },
    {
      field: 'imagem',
      header: 'Imagem',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      width: '10rem',
      align: 'center'
    },
    {
      field: 'nome',
      header: 'Descrição',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '20rem'
    },
    {
      field: 'localizacao',
      header: 'Localização',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '12rem'
    },
    {
      field: 'grupo',
      header: 'Grupo',
      type: 'custom',
      sortable: true,
      filterable: true,
      minWidth: '12rem'
    },
    {
      field: 'saldo',
      header: 'Saldo',
      type: 'number',
      sortable: true,
      filterable: true,
      width: '8rem',
      align: 'center'
    },
    {
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor(
    protected itemService: ItemService,
    protected injector: Injector,
    private readonly bottomSheetOptions: MatBottomSheet,
    private readonly reservaService: ReservaService
  ) {
    super(
      itemService,
      injector,
      ["id", "imagem", "nome", "localizacao", "grupo","saldo", "actions"],
      "item/form"
    );
    this.minioUrl = environment.minio_url;
    this.bottomSheetEnabled = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Item';
  }

  protected override getEntityPluralName(): string {
    return 'Itens';
  }

  // Override export filename for items
  protected override getExportFileName(): string {
    return 'itens';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'localizacao', 'saldo'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Itens',
      trackByField: 'id',
      emptyMessage: 'Nenhum item encontrado.',
      loadingMessage: 'Carregando itens...',
      globalFilterPlaceholder: 'Buscar itens...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'item-list',
      stateStorage: 'local',
      stateProps: {
        columns: true,
        filters: true,
        sort: true,
        pagination: true,
        selection: true,
        expandedRows: true
      },
      resizableColumns: true,
      columnResizeMode: 'fit',
      lazy: true,
      lazyLoadOnInit: true,
      preloadData: true,
      keyboardShortcuts: true
    };

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  postFindAll(): void {
    this.loginService
      .userLoggedIsAlunoOrProfessor()
      .then((value) => {
        this.isAlunoOrProfessor = value;
        this.cdr.markForCheck();
      });
  }

  openOptions(id): void {
    const sheet = this.bottomSheetOptions.open(BottomSheetItemComponent);
    sheet.afterDismissed().subscribe((action) => {
      if (action === "E") {
        this.edit(id);
      } else if (action === "R") {
        this.delete(id);
      } else if (action === "C") {
        this.copyItem(id);
      } else if (action === "D") {
        this.findReservasItem(id);
      }
    });
  }

  findReservasItem(id) {
    this.loaderService.show();
    this.reservaService.findAllByIdItem(id).subscribe(
      (e) => {
        this.loaderService.hide();
        if (e.length > 0) {
          this.reservasItem = e;
          this.dialogReservaitem = true;
          this.cdr.markForCheck();
        } else {
          Swal.fire("Ops...", "Este item não possui nenhuma reserva.", "info");
        }
      },
      (error) => {
        console.log(error);
        this.loaderService.hide();
      }
    );
  }

  copyItem(id) {
    this.router.navigate(["item/form/copy", id]);
  }
}
