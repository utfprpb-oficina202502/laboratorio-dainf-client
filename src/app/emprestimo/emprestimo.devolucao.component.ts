import {ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {take} from 'rxjs';
import {MenuItem, MessageService} from 'primeng/api';
import {Z_INDEX} from '../framework/constants';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {LoaderService} from '../framework/loader/loader.service';
import {extractRouteParam, parseNumericId} from '../framework/utils/route-params.operators';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import {Menu, MenuModule} from 'primeng/menu';

// PrimeNG
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DatePickerModule} from 'primeng/datepicker';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {BreakpointService} from '../framework/services/breakpoint.service';
import {FormFieldComponent} from '../framework/component/form-field.component';

@Component({
    selector: 'app-devolucao-emprestimo',
    templateUrl: './emprestimo.devolucao.component.html',
    styleUrls: ['./emprestimo.devolucao.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MenuModule,
    ScrollPanelModule,
    TagModule,
    TextareaModule,
    TooltipModule,
    // Angular CDK
    DragDropModule,
    // Custom
    CancelarComponent,
    FormFieldComponent,
    SalvarComponent,
    VoltarComponent,
  ]
})
export class EmprestimoDevolucaoComponent implements OnInit {
  // State signals
  readonly emprestimo = signal<Emprestimo | null>(null);
  readonly itensPendentes = signal<EmprestimoDevolucaoItem[]>([]);
  readonly itensDevolvidos = signal<EmprestimoDevolucaoItem[]>([]);
  readonly itensSaida = signal<EmprestimoDevolucaoItem[]>([]);
  readonly documentoUsuario = signal<string>('');
  // Dialog state
  qtdeItemDuplicado: number | undefined;
  readonly contextMenu = viewChild<Menu>('contextMenu');
  readonly itemIsEditing = signal<EmprestimoDevolucaoItem | null>(null);
  dialogDuplicaItem = false;
  // Context menu
  contextMenuPosition = {x: 0, y: 0};
  protected readonly breakpointService = inject(BreakpointService);
  // Service injections
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly loaderService = inject(LoaderService);
  contextMenuItems: MenuItem[] = [];

  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  ngOnInit(): void {
    this.route.params.pipe(
      extractRouteParam({
        paramName: 'id',
        converter: parseNumericId,
        onError: () => {
          this.back();
        }
      }),
      take(1)
    ).subscribe({
      next: (id) => {
        if (id !== null) {
          this.loadEmprestimo(id);
        }
      }
    });
  }

  back(): void {
    this.router.navigate(['/emprestimo']);
  }

  saveDevolucao(): void {
    const emp = this.emprestimo();
    if (!emp) return;

    this.loaderService.show();
    this.atualizarStatusItens();

    this.emprestimoService.saveDevolucao(emp)
    .subscribe({
      next: () => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso!',
          detail: 'Devolução efetuada com sucesso!',
          life: 3000
        });
        this.back();
      },
      error: () => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao salvar a devolução!',
          life: 5000
        });
      }
    });
  }

  duplicarItem(): void {
    const emp = this.emprestimo();
    const editingItem = this.itemIsEditing();
    if (!emp || !editingItem || this.disableBtnSaveDuplicar() || this.qtdeItemDuplicado === null || this.qtdeItemDuplicado === undefined) {
      return;
    }

    const itemDuplicado = structuredClone(editingItem);
    itemDuplicado.qtde = this.qtdeItemDuplicado;
    itemDuplicado.id = null as unknown as number;

    // Atualiza a lista de pendentes
    this.itensPendentes.update(list => [...list, itemDuplicado]);

    // Atualiza o empréstimo
    emp.emprestimoDevolucaoItem.push(itemDuplicado);
    this.emprestimo.set({...emp});

    // Atualiza o item original
    editingItem.qtde = editingItem.qtde - this.qtdeItemDuplicado;

    // Reset dialog state
    this.qtdeItemDuplicado = undefined;
    this.dialogDuplicaItem = false;
  }

  onContextMenu(event: MouseEvent, item: EmprestimoDevolucaoItem): void {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    this.itemIsEditing.set(item);

    const options = this.verificaOptionsEnabled(item);

    this.contextMenuItems = [
      {
        label: 'Duplicar Item',
        icon: 'pi pi-copy',
        disabled: !options.canDuplicate,
        command: () => this.openDialogDuplicarItem(item)
      },
      {
        label: 'Remover Itens Duplicados',
        icon: 'pi pi-trash',
        disabled: !options.canRemoveDuplicates,
        command: () => this.removeItensDuplicadosByItem(item)
      }
    ];

    this.contextMenu()?.show(event);
  }

  drop(event: CdkDragDrop<EmprestimoDevolucaoItem[]>): void {
    if (event.previousContainer === event.container) {
      // Same container: reorder items
      const updatedList = [...event.container.data];
      moveItemInArray(updatedList, event.previousIndex, event.currentIndex);
      this.updateSignalByList(event.container.data, updatedList);
    } else {
      // Different containers: transfer item
      const sourceList = [...event.previousContainer.data];
      const targetList = [...event.container.data];

      // Transfer item between arrays
      transferArrayItem(sourceList, targetList, event.previousIndex, event.currentIndex);

      // Update both signals atomically to prevent animation glitches
      this.updateSignalByList(event.previousContainer.data, sourceList);
      this.updateSignalByList(event.container.data, targetList);
    }
  }

  openDialogDuplicarItem(item: EmprestimoDevolucaoItem): void {
    this.dialogDuplicaItem = true;
    this.itemIsEditing.set(item);
  }

  removeItensDuplicadosByItem(item: EmprestimoDevolucaoItem): void {
    const emp = this.emprestimo();
    if (!emp) return;

    const pendentes = [...this.itensPendentes()];
    const devolvidos = [...this.itensDevolvidos()];
    const saida = [...this.itensSaida()];

    const {
      matchingItems,
      duplicates
    } = this.collectMatchingItems(item, emp, pendentes, devolvidos, saida);

    if (duplicates.length === 0) return;

    const canonicalItem = this.findCanonicalItem(matchingItems);
    canonicalItem.qtde = this.calculateTotalQuantity(matchingItems);

    this.removeDuplicatesFromAllLists(duplicates, canonicalItem, emp, pendentes, devolvidos, saida);

    this.updateAllSignals(emp, pendentes, devolvidos, saida);
  }

  /**
   * Coleta todos os itens correspondentes e duplicatas de todas as listas
   * @param item - Item de referência para busca
   * @param emp - Empréstimo atual
   * @param pendentes - Lista de itens pendentes
   * @param devolvidos - Lista de itens devolvidos
   * @param saida - Lista de itens de saída
   * @returns Objeto contendo itens correspondentes únicos e duplicatas identificadas
   */
  private collectMatchingItems(
    item: EmprestimoDevolucaoItem,
    emp: Emprestimo,
    pendentes: EmprestimoDevolucaoItem[],
    devolvidos: EmprestimoDevolucaoItem[],
    saida: EmprestimoDevolucaoItem[]
  ): { matchingItems: EmprestimoDevolucaoItem[]; duplicates: EmprestimoDevolucaoItem[] } {
    const allLists = [emp.emprestimoDevolucaoItem, pendentes, devolvidos, saida];
    const uniqueMatchingItems = new Set<EmprestimoDevolucaoItem>();
    const duplicatesSet = new Set<EmprestimoDevolucaoItem>();

    for (const list of allLists) {
      for (const empDevItem of list) {
        if (empDevItem.item.id === item.item.id) {
          uniqueMatchingItems.add(empDevItem);
          if (this.isDuplicate(empDevItem)) {
            duplicatesSet.add(empDevItem);
          }
        }
      }
    }

    return {
      matchingItems: Array.from(uniqueMatchingItems),
      duplicates: Array.from(duplicatesSet)
    };
  }

  /**
   * Verifica se um item é uma duplicata (id nulo ou zero)
   * @param item - Item a ser verificado
   * @returns true se o item for uma duplicata
   */
  private isDuplicate(item: EmprestimoDevolucaoItem): boolean {
    return item.id === null || item.id === 0;
  }

  /**
   * Encontra o item canônico (com id válido) ou retorna o primeiro disponível
   * @param matchingItems - Lista de itens correspondentes
   * @returns Item canônico selecionado
   */
  private findCanonicalItem(matchingItems: EmprestimoDevolucaoItem[]): EmprestimoDevolucaoItem {
    return matchingItems.find(i => i.id) ?? matchingItems[0];
  }

  /**
   * Calcula a quantidade total somando todos os itens correspondentes
   * @param matchingItems - Lista de itens para somar
   * @returns Quantidade total calculada
   */
  private calculateTotalQuantity(matchingItems: EmprestimoDevolucaoItem[]): number {
    return matchingItems.reduce((total, item) => total + Number(item.qtde), 0);
  }

  /**
   * Remove duplicatas de todas as listas exceto o item canônico
   * @param duplicates - Lista de duplicatas a remover
   * @param canonicalItem - Item canônico que deve ser preservado
   * @param emp - Empréstimo atual
   * @param pendentes - Lista de itens pendentes
   * @param devolvidos - Lista de itens devolvidos
   * @param saida - Lista de itens de saída
   */
  private removeDuplicatesFromAllLists(
    duplicates: EmprestimoDevolucaoItem[],
    canonicalItem: EmprestimoDevolucaoItem,
    emp: Emprestimo,
    pendentes: EmprestimoDevolucaoItem[],
    devolvidos: EmprestimoDevolucaoItem[],
    saida: EmprestimoDevolucaoItem[]
  ): void {
    const duplicatesToRemove = duplicates.filter(dup => dup !== canonicalItem);

    for (const duplicate of duplicatesToRemove) {
      this.removeFromList(emp.emprestimoDevolucaoItem, duplicate);
      this.removeFromList(pendentes, duplicate);
      this.removeFromList(devolvidos, duplicate);
      this.removeFromList(saida, duplicate);
    }
  }

  /**
   * Remove um item de uma lista se ele estiver presente
   * @param list - Lista de onde remover o item
   * @param item - Item a ser removido
   */
  private removeFromList(list: EmprestimoDevolucaoItem[], item: EmprestimoDevolucaoItem): void {
    const index = list.indexOf(item);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }

  /**
   * Atualiza todos os signals com os valores atualizados
   * @param emp - Empréstimo atualizado
   * @param pendentes - Lista de pendentes atualizada
   * @param devolvidos - Lista de devolvidos atualizada
   * @param saida - Lista de saída atualizada
   */
  private updateAllSignals(
    emp: Emprestimo,
    pendentes: EmprestimoDevolucaoItem[],
    devolvidos: EmprestimoDevolucaoItem[],
    saida: EmprestimoDevolucaoItem[]
  ): void {
    this.emprestimo.set({...emp});
    this.itensPendentes.set(pendentes);
    this.itensDevolvidos.set(devolvidos);
    this.itensSaida.set(saida);
  }

  verificaOptionsEnabled(item: EmprestimoDevolucaoItem): {
    canDuplicate: boolean;
    canRemoveDuplicates: boolean;
  } {
    const emp = this.emprestimo();
    if (!emp) {
      return {canDuplicate: false, canRemoveDuplicates: false};
    }

    let count = 0;
    for (const empDevItem of emp.emprestimoDevolucaoItem) {
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

  disableBtnSaveDuplicar(): boolean {
    const editingItem = this.itemIsEditing();
    const qtde = Number(this.qtdeItemDuplicado);

    return this.qtdeItemDuplicado === null || this.qtdeItemDuplicado === undefined
      || this.qtdeItemDuplicado.toString() === ''
      || !editingItem
      || Number.isNaN(qtde)
      || qtde <= 0
      || qtde >= editingItem.qtde;
  }

  /**
   * Atualiza o signal correspondente à lista fornecida
   * @param originalList - Lista original (referência do signal)
   * @param updatedList - Lista atualizada com novas referências
   */
  private updateSignalByList(originalList: EmprestimoDevolucaoItem[], updatedList: EmprestimoDevolucaoItem[]): void {
    if (originalList === this.itensPendentes()) {
      this.itensPendentes.set(updatedList);
    } else if (originalList === this.itensDevolvidos()) {
      this.itensDevolvidos.set(updatedList);
    } else if (originalList === this.itensSaida()) {
      this.itensSaida.set(updatedList);
    }
  }

  private loadEmprestimo(id: number): void {
    this.loaderService.show();
    this.emprestimoService.findOne(id)
    .subscribe({
      next: (emprestimo) => {
        this.emprestimo.set(emprestimo);
        this.documentoUsuario.set(emprestimo.usuarioEmprestimo.documento);
        this.buildItensKanban();
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao buscar o empréstimo!',
          life: 5000
        });
        this.back();
      }
    });
  }

  private buildItensKanban(): void {
    const emp = this.emprestimo();
    if (!emp) return;

    const pendentes: EmprestimoDevolucaoItem[] = [];
    const devolvidos: EmprestimoDevolucaoItem[] = [];
    const saida: EmprestimoDevolucaoItem[] = [];

    for (const empDevItem of emp.emprestimoDevolucaoItem) {
      switch (empDevItem.statusDevolucao) {
        case StatusDevolucao.P:
          pendentes.push(empDevItem);
          break;
        case StatusDevolucao.D:
          devolvidos.push(empDevItem);
          break;
        case StatusDevolucao.S:
          saida.push(empDevItem);
          break;
      }
    }

    this.itensPendentes.set(pendentes);
    this.itensDevolvidos.set(devolvidos);
    this.itensSaida.set(saida);
  }

  /**
   * Atualiza o status de devolução dos itens com base nas listas de kanban
   */
  private atualizarStatusItens(): void {
    const emp = this.emprestimo();
    if (!emp) return;

    const pendentes = this.itensPendentes();
    const devolvidos = this.itensDevolvidos();
    const saida = this.itensSaida();

    for (const empDevItem of emp.emprestimoDevolucaoItem) {
      this.atualizarStatusSePresente(empDevItem, pendentes, StatusDevolucao.P);
      this.atualizarStatusSePresente(empDevItem, devolvidos, StatusDevolucao.D);
      this.atualizarStatusSePresente(empDevItem, saida, StatusDevolucao.S);
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
    if (lista.includes(empDevItem)) {
      empDevItem.statusDevolucao = status;
    }
  }
}

