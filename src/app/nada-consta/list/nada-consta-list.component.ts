import { Component, forwardRef, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableFilterCaptionComponent } from '../../framework/component/table-filter-caption.component';
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
import { getNadaConstaStatusLabel, getNadaConstaStatusSeverity } from '../../framework/utils/status-label.util';
import { createTableConfig } from '../../framework/utils/table-config.factory';
import { TableEmptyStateComponent } from '../../framework/component/table-empty-state.component';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TableFilterCaptionComponent,
    TableEmptyStateComponent
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

  public tableColumns: TableColumn[] = [
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

  protected readonly service = inject(NadaConstaService);

  protected cdr = inject(ChangeDetectorRef);

  // Getter público para facilitar testes
  getCdr() { return this.cdr; }

  constructor() {
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
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'usuarioUsername', 'status'],
      defaultSortField: 'id',
      defaultSortOrder: -1,
      caption: 'Lista de Nada Consta',
      trackByField: 'id',
      emptyMessage: 'Nenhum registro encontrado.',
      loadingMessage: 'Carregando registros...',
      globalFilterPlaceholder: 'Buscar Nada Consta...',
      stateKey: 'nada-consta-list',
    });
    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    // Exibe por padrão apenas os campos principais
    this.displayedColumns = ['id', 'usuarioUsername', 'status', 'sendAt', 'acoes'];
  }

  // Sinal para controlar exibição do modal
  protected readonly showAdicionarModal = signal(false);
  // Sinal para armazenar o valor do Registro Acadêmico
  protected readonly registroAcademico = signal('');
  protected readonly solicitando = signal(false);
  protected readonly solicitacaoErro = signal<string | null>(null);
  protected readonly solicitacaoSucesso = signal(false);
  // Sinal para o valor do filtro global (deve ser público para uso no template)
  public filterValue = '';

  /**
   * Getter público para o sinal showAdicionarModal
   * @returns boolean
   */
  public getShowAdicionarModal() {
    return this.showAdicionarModal();
  }

  /**
   * Getter público para o sinal registroAcademico
   * @returns string
   */
  public getRegistroAcademico() {
    return this.registroAcademico();
  }

  /**
   * Setter público para o sinal registroAcademico
   * @param valor Novo valor do registro acadêmico
   */
  public setRegistroAcademico(valor: string) {
    this.registroAcademico.set(valor);
  }

  /**
   * Getter público para o sinal solicitando
   * @returns boolean
   */
  public getSolicitando() {
    return this.solicitando();
  }

  /**
   * Getter público para o sinal solicitacaoErro
   * @returns string | null
   */
  public getSolicitacaoErro() {
    return this.solicitacaoErro();
  }

  /**
   * Getter público para o sinal solicitacaoSucesso
   * @returns boolean
   */
  public getSolicitacaoSucesso() {
    return this.solicitacaoSucesso();
  }

  adicionar(): void {
    this.showAdicionarModal.set(true);
  }

  cancelarAdicionar(): void {
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
      .pipe(finalize(() => {
        this.solicitando.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.solicitacaoSucesso.set(true);
          this.showAdicionarModal.set(false);
          this.registroAcademico.set('');
          // Atualiza a lista conforme padrão de empréstimos
          this.findAll();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.solicitacaoErro.set(err?.error?.message || 'Erro ao solicitar Nada Consta.');
          this.cdr.markForCheck();
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
    return getNadaConstaStatusLabel(status);
  }

  getStatusSeverity(status: string): 'warn' | 'success' | 'danger' {
    return getNadaConstaStatusSeverity(status);
  }

  reenviarNadaConsta(element: NadaConsta): void {
    // Use console.log instead of alert to be test-friendly and avoid JSDOM/windows issues
    console.log(`Reenviar Nada Consta para registro ID ${element.id}`);
  }

  atualizarStatus(element: NadaConsta): void {
    // Use console.log instead of alert to be test-friendly
    console.log(`Atualizar status do registro ID ${element.id}`);
  }

  protected override urlForm = '';

  public override openForm(): void {
    this.showAdicionarModal.set(true);
  }
}
