import {ChangeDetectionStrategy, Component, forwardRef, inject, viewChild} from "@angular/core";
import {NgOptimizedImage} from '@angular/common';
import {Z_INDEX} from '../framework/constants';
import {Item} from "./item";
import {ItemService} from "./item.service";
import {Grupo} from '../grupo/grupo';
import {PrimeCrudListComponent} from "../framework/component/prime-crud.list.component";
import {TableColumn} from '../framework/model/table-config.interface';
import {MenuItem} from 'primeng/api';
import {Popover, PopoverModule} from 'primeng/popover';
import {ReservaService} from "../reserva/reserva.service";
import {Reserva} from "../reserva/reserva";
import {environment} from "src/environments/environment";
import {DialogModule} from 'primeng/dialog';
import {MenuModule} from 'primeng/menu';
import {NovoComponent} from '../geral/novo/novo.component';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {BreakpointService} from '../framework/services/breakpoint.service';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';

@Component({
    selector: "app-list-item",
    templateUrl: "./item.list.component.html",
    styleUrls: ["./item.list.component.css"],
  imports: [
    PrimeTableSharedModule,
    DialogModule,
    PopoverModule,
    MenuModule,
    NovoComponent,
    NgOptimizedImage,
    TableDefaultTemplatesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => ItemListComponent) }]
})
export class ItemListComponent extends PrimeCrudListComponent<Item, number> {
  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');

  protected override service = inject(ItemService);
  protected override columnsTable = ["id", "imagem", "nome", "localizacao", "grupo", "Estoque Total", "Disponível para Empréstimo","actions"];

  private readonly reservaService = inject(ReservaService);
  protected readonly breakpointService = inject(BreakpointService);
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  protected override urlForm = "item/form";
  contextMenuItems: MenuItem[] = [];
  selectedItem!: Item;

  reservasItem: Reserva[] = [];
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
      minWidth: '12rem',
      align: 'center'
    },
    {
      field: 'saldo',
      header: 'Estoque Total',
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

  /**
   * Retorna a severidade (cor) do badge para categorias de itens
   * Usa o ID do grupo para distribuir cores de forma consistente
   */
  getGrupoBadgeSeverity(grupo: Grupo | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (!grupo) {
      return 'secondary';
    }

    // Array de cores disponíveis no PrimeNG
    const severities: ('success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast')[] = [
      'info',      // Azul
      'success',   // Verde
      'warn',      // Laranja
      'danger',    // Vermelho
      'secondary', // Cinza
      'contrast'   // Preto/Branco (tema dependente)
    ];

    // Usa o ID do grupo para selecionar uma cor de forma consistente
    // Mesmo grupo sempre terá a mesma cor
    const colorIndex = grupo.id % severities.length;
    return severities[colorIndex];
  }

  // Override export filename for items
  protected override getExportFileName(): string {
    return 'itens';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'localizacao', 'Estoque Total'],
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
      preloadData: true,
      keyboardShortcuts: true
    };

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }



  openOptions(event: Event, item: Item): void {
    this.selectedItem = item;
    const isAlunoOrProfessor = this.isAlunoOrProfessor();
    const isMobile = !this.breakpointService.isDesktop();

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

    this.actionsMenu().toggle(event);
    this.cdr?.markForCheck();
  }

  findReservasItem(id: number): void {
    this.loaderService.show();
    this.reservaService.findAllByIdItem(id).subscribe(
      (e) => {
        this.loaderService.hide();
        if (e.length > 0) {
          this.reservasItem = e;
          this.dialogReservaitem = true;
          this.cdr?.markForCheck();
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Ops...',
            detail: 'Este item não possui nenhuma reserva.',
            life: 4000
          });
        }
      },
      () => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar reservas do item.',
          life: 5000
        });
      }
    );
  }

  copyItem(id: number): void {
    this.router.navigate(["item/form/copy", id]);
  }

}
