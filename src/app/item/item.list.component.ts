import {ChangeDetectionStrategy, Component, forwardRef, inject, ViewChild} from "@angular/core";
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Item} from "./item";
import {ItemService} from "./item.service";
import {PrimeCrudListComponent} from "../framework/component/prime-crud.list.component";
import {TableColumn} from '../framework/model/table-config.interface';
import {MenuItem} from 'primeng/api';
import {Popover, PopoverModule} from 'primeng/popover';
import {ReservaService} from "../reserva/reserva.service";
import Swal from "sweetalert2";
import {Reserva} from "../reserva/reserva";
import {environment} from "src/environments/environment";

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {Table, TableModule} from 'primeng/table';
import {MultiSelectModule} from 'primeng/multiselect';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {DialogModule} from 'primeng/dialog';

import {MenuModule} from 'primeng/menu';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';
import {NovoComponent} from '../geral/novo/novo.component';

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
    PopoverModule,
    MenuModule,
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,
    NovoComponent,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => ItemListComponent) }]
})
export class ItemListComponent extends PrimeCrudListComponent<Item, number> {
  @ViewChild('dt') dt?: Table;
  protected override service = inject(ItemService);
  protected override columnsTable = ["id", "imagem", "nome", "localizacao", "grupo", "saldo", "actions"];

  private readonly reservaService = inject(ReservaService);

  @ViewChild('actionsMenu') actionsMenu: Popover;
  protected override urlForm = "item/form";
  contextMenuItems: MenuItem[] = [];
  selectedItem: Item;

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

  constructor() {
    super();

    this.minioUrl = environment.minio_url;
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

  async openOptions(event: Event, item: Item): Promise<void> {
    this.selectedItem = item;
    const isAlunoOrProfessor = await this.loginService.userLoggedIsAlunoOrProfessor();
    const isMobile = globalThis.innerWidth <= 1200;

    this.contextMenuItems = [];

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Copiar',
        icon: 'pi pi-copy',
        command: () => this.copyItem(item.id)
      });
    }

    this.contextMenuItems.push({
      label: 'Reservas',
      icon: 'pi pi-clone',
      command: () => this.findReservasItem(item.id)
    });

    if (isMobile) {
      const mobileMenuItems = [
        {
          label: isAlunoOrProfessor ? 'Visualizar' : 'Editar',
          icon: isAlunoOrProfessor ? 'pi pi-eye' : 'pi pi-pencil',
          command: () => this.edit(item.id)
        }
      ];

      if (!isAlunoOrProfessor) {
        mobileMenuItems.push({
          label: 'Remover',
          icon: 'pi pi-trash',
          command: () => this.delete(item.id)
        });
      }

      this.contextMenuItems.push(...mobileMenuItems);
    }

    this.actionsMenu.toggle(event);
    this.cdr.markForCheck();
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
        this.loaderService.hide();
        Swal.fire("Erro", "Erro ao buscar reservas do item.", "error");
      }
    );
  }

  copyItem(id) {
    this.router.navigate(["item/form/copy", id]);
  }
}
