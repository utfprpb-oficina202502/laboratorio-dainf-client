import {ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class EmprestimoDevolucaoComponent implements OnInit {
  // View children
  readonly frm = viewChild.required<NgForm>('form');
  // State signals
  readonly emprestimo = signal<Emprestimo | null>(null);
  readonly itensPendentes = signal<EmprestimoDevolucaoItem[]>([]);
  readonly itensDevolvidos = signal<EmprestimoDevolucaoItem[]>([]);
  readonly itensSaida = signal<EmprestimoDevolucaoItem[]>([]);
  readonly documentoUsuario = signal<string>('');
  // Dialog state
  qtdeItemDuplicado: number | undefined;
  readonly contextMenu = viewChild<Menu>('contextMenu');
  // Context menu
  contextMenuPosition = {x: 0, y: 0};
  protected readonly breakpointService = inject(BreakpointService);
  // Service injections
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  itemIsEditing!: EmprestimoDevolucaoItem;
  dialogDuplicaItem = false;
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
      })
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
    if (!emp || this.disableBtnSaveDuplicar() || this.qtdeItemDuplicado === null || this.qtdeItemDuplicado === undefined) {
      return;
    }

    const itemDuplicado = structuredClone(this.itemIsEditing);
    itemDuplicado.qtde = this.qtdeItemDuplicado;
    itemDuplicado.id = 0;

    // Atualiza a lista de pendentes
    this.itensPendentes.update(list => [...list, itemDuplicado]);

    // Atualiza o empréstimo
    emp.emprestimoDevolucaoItem.push(itemDuplicado);
    this.emprestimo.set({...emp});

    // Atualiza o item original
    this.itemIsEditing.qtde = this.itemIsEditing.qtde - this.qtdeItemDuplicado;

    // Reset dialog state
    this.qtdeItemDuplicado = undefined;
    this.dialogDuplicaItem = false;
  }

  onContextMenu(event: MouseEvent, item: EmprestimoDevolucaoItem): void {
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

  drop(event: CdkDragDrop<EmprestimoDevolucaoItem[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  removeItensDuplicadosByItem(item: EmprestimoDevolucaoItem): void {
    const emp = this.emprestimo();
    if (!emp) return;

    // Coleta todas as listas do Kanban para processamento
    const pendentes = [...this.itensPendentes()];
    const devolvidos = [...this.itensDevolvidos()];
    const saida = [...this.itensSaida()];
    const allLists = [emp.emprestimoDevolucaoItem, pendentes, devolvidos, saida];

    // Usa Set para garantir referências únicas (mesmo item pode estar em múltiplas listas)
    const uniqueMatchingItems = new Set<EmprestimoDevolucaoItem>();
    const duplicates: EmprestimoDevolucaoItem[] = [];
    let canonicalItem: EmprestimoDevolucaoItem | undefined;

    // Escaneia todas as listas procurando itens correspondentes
    for (const list of allLists) {
      for (const empDevItem of list) {
        if (empDevItem.item.id === item.item.id) {
          uniqueMatchingItems.add(empDevItem);

          // Identifica duplicatas (id === null ou id === 0)
          if (empDevItem.id === null || empDevItem.id === 0) {
            if (!duplicates.includes(empDevItem)) {
              duplicates.push(empDevItem);
            }
          }
        }
      }
    }

    const matchingItems = Array.from(uniqueMatchingItems);

    // Se não há duplicatas, não há nada a fazer
    if (duplicates.length === 0) {
      return;
    }

    // Se não encontrou item canônico (não-duplicado), usa o primeiro encontrado
    canonicalItem ??= matchingItems[0];

    // Calcula quantidade total somando todos os itens correspondentes únicos
    let qtdeTotal = 0;
    for (const matchingItem of matchingItems) {
      qtdeTotal += Number(matchingItem.qtde);
    }

    // Atualiza quantidade do item canônico
    canonicalItem.qtde = qtdeTotal;

    // Remove todas as duplicatas de todas as listas
    for (const duplicate of duplicates) {
      // Pula o item canônico se ele for uma duplicata
      if (duplicate === canonicalItem) {
        continue;
      }

      // Remove do empréstimo
      const empIndex = emp.emprestimoDevolucaoItem.indexOf(duplicate);
      if (empIndex >= 0) {
        emp.emprestimoDevolucaoItem.splice(empIndex, 1);
      }

      // Remove das listas locais
      const pendIndex = pendentes.indexOf(duplicate);
      if (pendIndex >= 0) {
        pendentes.splice(pendIndex, 1);
      }

      const devIndex = devolvidos.indexOf(duplicate);
      if (devIndex >= 0) {
        devolvidos.splice(devIndex, 1);
      }

      const saidaIndex = saida.indexOf(duplicate);
      if (saidaIndex >= 0) {
        saida.splice(saidaIndex, 1);
      }
    }

    // Atualiza os signals
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

  openDialogDuplicarItem(item: EmprestimoDevolucaoItem): void {
    this.dialogDuplicaItem = true;
    this.itemIsEditing = item;
  }

  disableBtnSaveDuplicar(): boolean {
    return this.qtdeItemDuplicado === null || this.qtdeItemDuplicado === undefined
      || this.qtdeItemDuplicado.toString() === ''
      || this.qtdeItemDuplicado >= this.itemIsEditing.qtde;
  }

  onClickMenuDuplicateItem(item: EmprestimoDevolucaoItem): void {
    this.openDialogDuplicarItem(item);
  }

  onClickMenuRemoveDuplicates(item: EmprestimoDevolucaoItem): void {
    this.removeItensDuplicadosByItem(item);
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
    if (lista.some(item => item.id === empDevItem.id)) {
      empDevItem.statusDevolucao = status;
    }
  }
}

