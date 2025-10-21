import { Component, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeCrudListComponent } from '../../framework/component/prime-crud.list.component';
import { TableColumn } from '../../framework/model/table-config.interface';
import { NadaConstaService, NadaConsta } from '../nada-consta.service';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeCrudToolbarComponent } from '../../framework/component/prime-crud-toolbar.component';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableFilterCaptionComponent } from '../../framework/component/table-filter-caption.component';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    PrimeCrudToolbarComponent,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TableFilterCaptionComponent
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => NadaConstaListComponent) }]
})
export class NadaConstaListComponent extends PrimeCrudListComponent<NadaConsta, number> {
  protected override columnsTable: string[] = [
    'id',
    'usuarioUsername',
    'status',
    'sendAt',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    'acoes'
  ];

  private readonly tableColumns: TableColumn[] = [
    { field: 'id', header: 'ID', type: 'number', sortable: true, filterable: true, width: '8rem', align: 'center' },
    { field: 'usuarioUsername', header: 'Usuário', type: 'text', sortable: true, filterable: true, minWidth: '16rem' },
    { field: 'status', header: 'Status', type: 'text', sortable: true, filterable: true, width: '8rem', align: 'center' },
    { field: 'sendAt', header: 'Enviado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'createdAt', header: 'Criado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'updatedAt', header: 'Atualizado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'createdBy', header: 'Criado por', type: 'text', sortable: false, filterable: false, minWidth: '12rem' },
    { field: 'updatedBy', header: 'Atualizado por', type: 'text', sortable: false, filterable: false, minWidth: '12rem' },
    { field: 'acoes', header: 'Ações', type: 'custom', sortable: false, filterable: false, exportable: false, align: 'center', width: '10rem', toggleable: false }
  ];

  constructor(
    protected override service: NadaConstaService
  ) {
    super();
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Nada Consta';
  }

  protected override getEntityPluralName(): string {
    return 'Nada Consta';
  }

  protected override getExportFileName(): string {
    return 'nada-consta';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'usuarioUsername', 'status'],
      defaultSortField: 'id',
      defaultSortOrder: -1,
      caption: 'Lista de Nada Consta',
      trackByField: 'id',
      emptyMessage: 'Nenhum registro encontrado.',
      loadingMessage: 'Carregando registros...',
      globalFilterPlaceholder: 'Buscar Nada Consta...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'nada-consta-list',
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

  // Sinal para controlar exibição do modal
  protected readonly showAdicionarModal = signal(false);
  // Sinal para armazenar o valor do Registro Acadêmico
  protected readonly registroAcademico = signal('');
  protected readonly solicitando = signal(false);
  protected readonly solicitacaoErro = signal<string | null>(null);
  protected readonly solicitacaoSucesso = signal(false);
  // Sinal para o valor do filtro global (deve ser público para uso no template)
  public filterValue: string = '';

  adicionar(): void {
    console.log('Abrindo modal de adicionar Nada Consta');
    this.showAdicionarModal.set(true);
  }

  cancelarAdicionar(): void {
    console.log('Modal cancelado (fechando)'); // debug: confirma disparo ao clicar fora
    this.showAdicionarModal.set(false);
    this.registroAcademico.set('');
    this.solicitando.set(false);
    this.solicitacaoErro.set(null);
    this.solicitacaoSucesso.set(false);
  }

  continuarAdicionar(): void {
    const documento = this.registroAcademico().trim();
    if (!documento) return;
    this.solicitando.set(true);
    this.solicitacaoErro.set(null);
    this.solicitacaoSucesso.set(false);
    this.service.solicitar(documento)
      .pipe(finalize(() => this.solicitando.set(false)))
      .subscribe({
        next: () => {
          this.solicitacaoSucesso.set(true);
          this.showAdicionarModal.set(false);
          this.registroAcademico.set('');
          // Atualiza a lista conforme padrão de empréstimos
          this.findAll();
        },
        error: (err) => {
          this.solicitacaoErro.set(err?.error?.message || 'Erro ao solicitar Nada Consta.');
        }
      });
  }

  // Aplica filtro global na tabela
  onGlobalFilter(value: string): void {
    this.filterValue = value;
    this.applyFilter(value);
  }

  // Limpa o filtro global
  clearGlobalFilter(): void {
    this.filterValue = '';
    this.applyFilter('');
  }

  // Retorna o placeholder do filtro global
  getGlobalFilterPlaceholder(): string {
    return this.tableConfig?.globalFilterPlaceholder || 'Buscar Nada Consta...';
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Getter para expor pageSizeOptions ao template
  get pageSizeOptions(): number[] {
    return this.tableConfig?.pageSizeOptions || [5, 10, 25, 50, 100];
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'COM PENDÊNCIA';
      case 'COMPLETED': return 'EMITIDO';
      case 'FAILED': return 'FALHA';
      default: return status;
    }
  }

  getStatusSeverity(status: string): 'warning' | 'success' | 'danger' {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      default: return 'warning';
    }
  }

  reenviarNadaConsta(element: NadaConsta): void {
    // Implemente aqui a lógica para reenviar o Nada Consta
    // Exemplo: this.service.reenviar(element.id).subscribe(...)
    alert(`Reenviar Nada Consta para registro ID ${element.id}`);
  }

  atualizarStatus(element: NadaConsta): void {
    // Implemente aqui a lógica para atualizar o status
    // Exemplo: this.service.atualizarStatus(element.id).subscribe(...)
    alert(`Atualizar status do registro ID ${element.id}`);
  }

  protected override urlForm = '';

  public override openForm(): void {
    this.showAdicionarModal.set(true);
  }
}
