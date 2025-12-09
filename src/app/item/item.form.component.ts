import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {NAVIGATION, Z_INDEX} from '../framework/constants';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {PageResponse} from '../framework/service/crud.service';
import {Item} from './item';
import {ItemService} from './item.service';
import {Grupo} from '../grupo/grupo';
import {GrupoService} from '../grupo/grupo.service';
import {Emprestimo} from '../emprestimo/emprestimo';
import {EmprestimoService} from '../emprestimo/emprestimo.service';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {environment} from '../../environments/environment';
import {ItemImage} from './itemImage';
import {LoggerService} from '../framework/service/logger.service';
import {ConfirmationService, SortEvent} from 'primeng/api';
import {CartService} from '../framework/service/cart.service';
import {ItemAvailabilityUtil} from '../framework/utils/item-availability.util';

// PrimeNG
import {AutoCompleteCompleteEvent, AutoCompleteModule} from "primeng/autocomplete";
import {ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {CarouselModule} from "primeng/carousel";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {TextareaModule} from "primeng/textarea";
import {InputNumberModule} from "primeng/inputnumber";
import {SelectModule} from "primeng/select";
import {TableModule, TablePageEvent} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {ProgressBarModule} from 'primeng/progressbar';
import {TagModule} from 'primeng/tag';

// Framework
import {FormFieldComponent} from "../framework/component/form-field.component";

// Geral components
import {VoltarComponent} from "../geral/voltar/voltar.component";
import {CancelarComponent} from "../geral/cancelar/cancelar.component";
import {SalvarComponent} from "../geral/salvar/salvar.component";
import {CadastroRapidoComponent} from '../geral/cadastroRapido/cadastroRapido.component';

interface TipoItemOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-form-item',
  templateUrl: './item.form.component.html',
  imports: [
    CadastroRapidoComponent,
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    CarouselModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TooltipModule,
    ProgressBarModule,
    TagModule,
    // Framework
    FormFieldComponent,
    // Geral
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemFormComponent extends PrimeReactiveCrudFormComponent<Item, number> implements OnDestroy {
  readonly fileUpload = viewChild<FileUpload>('fileUpload');

  protected override service = inject(ItemService);
  protected override urlList = '/item';
  protected override type = Item;
  private readonly fb = inject(FormBuilder);
  private readonly grupoService = inject(GrupoService);
  private readonly emprestimoService = inject(EmprestimoService);
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  private grupoSubscription?: Subscription;
  private imagesSubscription?: Subscription;
  private emprestimosSubscription?: Subscription;
  protected readonly logger = inject(LoggerService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly cartService = inject(CartService);

  // Signals for component state
  protected readonly grupoList = signal<Grupo[]>([]);
  protected readonly grupoLoading = signal(false);
  protected readonly grupoTotalRecords = signal(0);
  protected readonly tipoItemOptions = signal<TipoItemOption[]>([
    { label: 'Consumo', value: 'C' },
    { label: 'Permanente', value: 'P' }
  ]);
  protected dialogImagens = signal(false);
  protected dialogImagemAmpliada = signal(false);
  protected readonly images = signal<ItemImage[]>([]);
  protected readonly selectedImage = signal<ItemImage | null>(null);
  protected readonly loadingImages = signal(false);

  // Empréstimos modal signals
  protected readonly emprestimosModalVisible = signal(false);
  protected readonly emprestimos = signal<Emprestimo[]>([]);
  protected readonly loadingEmprestimos = signal(false);
  private emprestimosRequestCancelled = false;

  // Pagination state for empréstimos
  protected readonly emprestimosPage = signal(0);
  protected readonly emprestimosRows = signal(10);
  protected readonly emprestimosTotalRecords = signal(0);
  protected readonly emprestimosFirst = signal(0);
  protected readonly emprestimosSortField = signal('id');
  protected readonly emprestimosSortOrder = signal(1); // 1 for ascending, -1 for descending

  // Pagination state for Grupo autocomplete
  private readonly GRUPO_PAGE_SIZE = 10;
  private grupoPage = 0;
  private grupoQuery = '';

  // Cart signals
  protected readonly cartQuantity = signal(1);

  // Computed signals
  protected readonly canShowImagens = computed(() => {
    const obj = this.object();
    return !!(obj && 'id' in obj && obj.id);
  });

  protected readonly isPatrimonioRequired = computed(() => {
    const formGroup = this.form();
    return formGroup?.get('tipoItem')?.value === 'P';
  });
  protected readonly isSaldoDisabled = computed(() => {
    const formGroup = this.form();
    const patrimonio = formGroup?.get('patrimonio')?.value;
    const tipoItem = formGroup?.get('tipoItem')?.value;
    return (patrimonio !== null && patrimonio !== undefined && patrimonio !== '') || tipoItem === 'P';
  });

  /**
   * Disponibilidade do item para empréstimo.
   */
  protected readonly disponibilidade = computed(() => {
    return ItemAvailabilityUtil.getDisponibilidade(this.object());
  });

  /**
   * Verifica se o item está no carrinho.
   */
  protected readonly isInCart = computed(() => {
    const obj = this.object();
    if (!obj?.id) return false;
    return this.cartService.isInCart(obj.id);
  });

  /**
   * Quantidade do item já no carrinho.
   */
  protected readonly inCartQuantity = computed(() => {
    const obj = this.object();
    if (!obj?.id) return 0;
    return this.cartService.getItemQuantity(obj.id);
  });

  /**
   * Máximo que pode ser adicionado ao carrinho.
   */
  protected readonly maxToAdd = computed(() => {
    const disponivel = this.disponibilidade();
    const inCart = this.inCartQuantity();
    return Math.max(0, disponivel - inCart);
  });

  /**
   * Verifica se há disponibilidade para adicionar ao carrinho.
   */
  protected readonly hasAvailability = computed(() => this.maxToAdd() > 0);

  /**
   * Severity do badge de disponibilidade.
   */
  protected readonly availabilitySeverity = computed(() => {
    return ItemAvailabilityUtil.getAvailabilitySeverity(this.object());
  });

  private callback?: () => void;

  constructor() {
    super();

    // Effect to handle form fields enable/disable based on user role
    effect(() => {
      const formGroup = this.form();
      if (!formGroup) return;

      const fieldsToToggle = ['nome', 'patrimonio', 'siorg', 'valor', 'localizacao', 'tipoItem', 'descricao', 'grupo'];

      // Always disable calculated fields
      formGroup.get('disponivelEmprestimoCalculado')?.disable({ emitEvent: false });
      formGroup.get('quantidadeEmprestada')?.disable({ emitEvent: false });

      if (this.isAlunoOrProfessor()) {
        for (const field of fieldsToToggle) {
          formGroup.get(field)?.disable();
        }
        formGroup.get('qtdeMinima')?.disable();
        formGroup.get('saldo')?.disable();
      } else {
        for (const field of fieldsToToggle) {
          formGroup.get(field)?.enable();
        }

        // qtdeMinima and saldo have additional conditions
        if (this.isSaldoDisabled()) {
          formGroup.get('qtdeMinima')?.disable();
          formGroup.get('saldo')?.disable();
        } else {
          formGroup.get('qtdeMinima')?.enable();
          formGroup.get('saldo')?.enable();
        }
      }
    });
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      patrimonio: [null],
      siorg: [null],
      valor: [null, [Validators.min(0)]],
      qtdeMinima: [null, [Validators.required, Validators.min(1)]],
      localizacao: ['', [Validators.required, Validators.maxLength(255)]],
      tipoItem: ['C', [Validators.required]],
      saldo: [null, [Validators.required, Validators.min(0)]],
      disponivelEmprestimoCalculado: [null, [Validators.min(0)]],
      quantidadeEmprestada: [null, [Validators.min(0)]],
      descricao: ['', [Validators.maxLength(4000)]],
      grupo: [null, [Validators.required]]
    });
  }

  /**
   * Initialize default values
   */
  protected override initializeValues(): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        tipoItem: 'C'
      });
    }
  }

  /**
   * Post edit hook for copy functionality
   */
  protected override postEdit(): void {
    if (globalThis.location.href.includes('copy')) {
      this.isEditing.set(false);
      const formGroup = this.form();
      if (formGroup) {
        formGroup.get('id')?.setValue(null);
      }
    }
  }

  /**
   * Override to patch form with object including complex fields
   */
  protected override patchFormWithObject(object: Item): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        patrimonio: object.patrimonio,
        siorg: object.siorg,
        valor: object.valor,
        qtdeMinima: object.qtdeMinima,
        localizacao: object.localizacao,
        tipoItem: object.tipoItem,
        saldo: object.saldo,
        disponivelEmprestimoCalculado: object.disponivelEmprestimoCalculado,
        quantidadeEmprestada: object.quantidadeEmprestada,
        descricao: object.descricao,
        grupo: object.grupo
      });

      // Update validators based on tipoItem
      this.updatePatrimonioValidators();
    }
  }

  /**
   * Override to prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Item>): Partial<Item> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;

    return {
      ...formValue,
      ...(id && { id })
    };
  }

  /**
   * Find grupos for autocomplete with pagination
   */
  findGrupos($event: AutoCompleteCompleteEvent): void {
    this.cancelGrupoRequest();

    // Reset pagination on new query
    if ($event.query !== this.grupoQuery) {
      this.grupoPage = 0;
      this.grupoList.set([]);
    }
    this.grupoQuery = $event.query;

    this.loadGruposPage();
  }

  /**
   * Handler for p-autoComplete onLazyLoad (virtual scroll)
   */
  onGrupoLazyLoad(event: { first: number; last: number }): void {
    this.cancelGrupoRequest(); // Cancel previous request to prevent race condition

    const currentLength = this.grupoList().length;
    const neededPage = Math.floor(event.last / this.GRUPO_PAGE_SIZE);

    // Load next page if approaching end and more records exist
    if (neededPage >= this.grupoPage && currentLength < this.grupoTotalRecords()) {
      this.grupoPage = neededPage;
      this.loadGruposPage();
    }
  }

  /**
   * Load a page of grupos
   */
  private loadGruposPage(): void {
    this.grupoLoading.set(true);

    this.grupoSubscription = this.grupoService
    .completePaged(this.grupoQuery, this.grupoPage, this.GRUPO_PAGE_SIZE)
    .subscribe({
      next: (response) => {
        // Append to existing list for virtual scroll
        const currentList = this.grupoList();
        if (this.grupoPage === 0) {
          this.grupoList.set(response.content);
        } else {
          this.grupoList.set([...currentList, ...response.content]);
        }
        this.grupoTotalRecords.set(response.totalElements);
        this.grupoLoading.set(false);
      },
      error: (error) => {
        this.logger.error('Error fetching grupos', error);
        this.grupoLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar grupos. Tente novamente.',
          life: 5000
        });
      }
    });
  }

  /**
   * Handle file upload complete
   */
  onUpload(): void {
    if (this.callback) {
      this.callback();
    }
  }

  /**
   * Get upload URL for images
   */
  getUrlUploadImages(): string {
    const obj = this.object();
    return `${environment.api_url}item/upload-images?idItem=${obj?.id || ''}`;
  }

  /**
   * Post save hook for file upload
   */
  protected override postSave(callback: () => void): void {
    const upload = this.fileUpload();
    if (upload?.files && upload.files.length > 0) {
      upload.url = this.getUrlUploadImages();
      upload.upload();
      this.callback = callback;
    } else {
      callback();
    }
  }

  /**
   * Cancel ongoing grupo request
   */
  private cancelGrupoRequest(): void {
    if (this.grupoSubscription && !this.grupoSubscription.closed) {
      this.grupoSubscription.unsubscribe();
    }
  }

  /**
   * Show dialog with item images
   */
  showDialogImagens(): void {
    this.findItemImages();
  }

  /**
   * Delete an image
   */
  deleteImage(image: ItemImage): void {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja remover a imagem? Ação não poderá ser desfeita.',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.performDeleteImage(image);
      }
    });
  }

  /**
   * Define uma imagem como capa do item
   */
  setCoverImage(image: ItemImage): void {
    const obj = this.object();
    if (!obj?.id || !image?.id) return;

    this.loaderService.show();
    this.service.setCoverImage(obj.id, image.id).subscribe({
      next: () => {
        // Atualiza localmente o estado das imagens
        this.images.update(imgs =>
          imgs.map(img => ({
            ...img,
            isCover: img.id === image.id
          }))
        );
        this.loaderService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Imagem definida como capa'
        });
      },
      error: (error) => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível definir a imagem como capa'
        });
        this.logger.error('Erro ao definir imagem como capa', error);
      }
    });
  }

  /**
   * Cancel ongoing images request
   */
  private cancelImagesRequest(): void {
    if (this.imagesSubscription && !this.imagesSubscription.closed) {
      this.imagesSubscription.unsubscribe();
      this.loadingImages.set(false);
      this.loaderService.hide();
    }
  }

  /**
   * Fetch item images
   */
  private findItemImages(): void {
    const obj = this.object();
    if (!obj || !('id' in obj) || !obj.id) {
      return;
    }

    this.cancelImagesRequest();

    this.loadingImages.set(true);
    this.loaderService.show();

    this.imagesSubscription = this.service.findAllImagesItem(obj.id).subscribe({
      next: (images) => {
        this.loadingImages.set(false);
        this.loaderService.hide();
        if (images.length > 0) {
          this.images.set(images);
          this.dialogImagens.set(true);
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Ops...',
            detail: 'Esse item não possui imagens.',
            life: 4000
          });
        }
      },
      error: (error) => {
        this.loadingImages.set(false);
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar imagens.',
          life: 5000
        });
        this.logger.error('Erro ao buscar imagens', error);
      }
    });
  }

  /**
   * Perform the actual image deletion
   */
  private performDeleteImage(image: ItemImage): void {
    const obj = this.object();
    if (!obj || !('id' in obj) || !obj.id) {
      return;
    }

    this.loaderService.show();
    this.service.deleteImage(image, obj.id).subscribe({
      next: () => {
        this.deleteImageInObject(image);
        this.loaderService.hide();
        this.dialogImagens.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso!',
          detail: 'Imagem removida com sucesso!',
          life: 3000
        });
      },
      error: (error) => {
        this.loaderService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao remover a imagem',
          life: 5000
        });
        this.logger.error('Erro ao remover a imagem', error);
      }
    });
  }

  /**
   * Remove image from object array
   */
  private deleteImageInObject(image: ItemImage): void {
    const obj = this.object();
    if (!obj?.imageItem) {
      return;
    }

    const index = obj.imageItem.findIndex(img => img.id === image.id);
    if (index !== -1) {
      obj.imageItem.splice(index, 1);
    }
  }

  /**
   * Handle tipoItem change to update saldo defaults
   */
  onTipoItemChange(): void {
    this.updatePatrimonioValidators();
    this.setSaldoDefaultItem();
  }



  /**
   * Update patrimonio validators based on tipoItem
   */
  private updatePatrimonioValidators(): void {
    const formGroup = this.form();
    if (!formGroup) return;

    const patrimonioControl = formGroup.get('patrimonio');
    const tipoItem = formGroup.get('tipoItem')?.value;

    if (tipoItem === 'P') {
      patrimonioControl?.setValidators([Validators.required]);
    } else {
      patrimonioControl?.clearValidators();
    }
    patrimonioControl?.updateValueAndValidity();
  }

  /**
   * Set default saldo based on patrimonio/tipoItem
   */
  private setSaldoDefaultItem(): void {
    const formGroup = this.form();
    if (!formGroup) return;

    const patrimonio = formGroup.get('patrimonio')?.value;
    const tipoItem = formGroup.get('tipoItem')?.value;

    if ((patrimonio !== null && patrimonio !== undefined && patrimonio !== '') || tipoItem === 'P') {
      formGroup.patchValue({
        saldo: 1,
        qtdeMinima: 1
      });
    } else {
      // Don't clear values, let user manage them
    }
  }

  /**
   * Abre o dialog de visualização ampliada da imagem
   * @param image Imagem a ser exibida
   */
  openImagePreview(image: ItemImage): void {
    this.selectedImage.set(image);
    this.dialogImagemAmpliada.set(true);
  }

  /**
   * Constrói a URL completa para uma imagem do MinIO
   * @param imageName Nome do arquivo da imagem
   * @returns URL completa para o MinIO
   */
  getImageUrl(imageName: string): string {
    if (!imageName) {
      return 'no-image.svg';
    }
    // Se já for URL absoluta, retorna como está
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }
    // Adiciona prefixo do MinIO
    return `${environment.minio_url}${imageName}`;
  }

  /**
   * Abre o modal de empréstimos do item
   */
  openEmprestimosModal(): void {
    const obj = this.object();
    if (!obj || !('id' in obj) || !obj.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Salve o item primeiro para visualizar os empréstimos.',
        life: 4000
      });
      return;
    }

    // Reset cancelled flag and open modal with loading state
    this.emprestimosRequestCancelled = false;
    this.emprestimosModalVisible.set(true);
    this.loadingEmprestimos.set(true);
    this.emprestimos.set([]);

    // Reset pagination state
    this.emprestimosPage.set(0);
    this.emprestimosFirst.set(0);
    this.emprestimosTotalRecords.set(0);
    this.emprestimosSortField.set('id');
    this.emprestimosSortOrder.set(1);

    // Start the HTTP request
    this.loadEmprestimosByItem(obj.id);
  }

  /**
   * Carrega empréstimos do item via API
   * @param itemId ID do item
   */
  private loadEmprestimosByItem(itemId: number): void {
    this.cancelEmprestimosRequest();

    this.emprestimosSubscription = this.emprestimoService
      .findByItemPaged(itemId, this.emprestimosPage(), this.emprestimosRows(), this.emprestimosSortField(), this.emprestimosSortOrder() === 1)
      .subscribe({
        next: (response: PageResponse<Emprestimo>) => {
          // Only update data if request wasn't cancelled
          if (!this.emprestimosRequestCancelled) {
            this.emprestimos.set(response.content);
            this.emprestimosTotalRecords.set(response.totalElements);
          }
          this.loadingEmprestimos.set(false);
        },
        error: (error) => {
          if (!this.emprestimosRequestCancelled) {
            this.loadingEmprestimos.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao carregar empréstimos do item.',
              life: 5000
            });
            this.logger.error('Erro ao carregar empréstimos do item', error);
          }
        }
      });
  }

  /**
   * Handle pagination changes for empréstimos table
   * @param event Pagination event from p-table
   */
  onEmprestimosPageChange(event: TablePageEvent): void {
    this.emprestimosFirst.set(event.first ?? 0);
    this.emprestimosRows.set(event.rows ?? 10);
    this.emprestimosPage.set(Math.floor((event.first ?? 0) / (event.rows ?? 10)));

    const obj = this.object();
    if (obj && 'id' in obj && obj.id) {
      this.loadingEmprestimos.set(true);
      this.loadEmprestimosByItem(obj.id);
    }
  }

  /**
   * Handle sorting changes for empréstimos table
   * @param event Sort event from p-table
   */
  onEmprestimosSort(event: SortEvent): void {
    this.emprestimosSortField.set(event.field ?? 'id');
    this.emprestimosSortOrder.set(event.order ?? 1);

    const obj = this.object();
    if (obj && 'id' in obj && obj.id) {
      this.loadingEmprestimos.set(true);
      this.loadEmprestimosByItem(obj.id);
    }
  }

  /**
   * Navega para o detalhamento do empréstimo
   * @param emprestimoId ID do empréstimo
   */
  viewEmprestimo(emprestimoId: number): void {
    this.emprestimosModalVisible.set(false);
    this.router.navigate(['emprestimo/form', emprestimoId]);
  }

  /**
   * Fecha o modal de empréstimos
   */
  closeEmprestimosModal(): void {
    this.emprestimosRequestCancelled = true;
    this.emprestimosModalVisible.set(false);
    this.emprestimos.set([]);
    this.loadingEmprestimos.set(false);
    this.cancelEmprestimosRequest();
  }

  /**
   * Cancel ongoing emprestimos request
   */
  private cancelEmprestimosRequest(): void {
    if (this.emprestimosSubscription && !this.emprestimosSubscription.closed) {
      this.emprestimosSubscription.unsubscribe();
    }
  }

  // ===== Métodos do Carrinho =====
  /**
   * Controle de debounce para navegação ao carrinho.
   */
  private navigatingToReserva = false;
  /**
   * Timer ID para cleanup do debounce de navegação.
   */
  private navigationTimerId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Adiciona o item ao carrinho com a quantidade selecionada.
   */
  addToCart(): void {
    const obj = this.object();
    if (!obj?.id) return;

    const qtde = this.cartQuantity();
    const maxToAdd = this.maxToAdd();

    if (qtde > 0 && qtde <= maxToAdd) {
      const success = this.cartService.addItem(obj, qtde);
      if (success) {
        this.cartQuantity.set(1);
        this.messageService.add({
          severity: 'success',
          summary: 'Adicionado',
          detail: `${qtde} ${qtde === 1 ? 'unidade adicionada' : 'unidades adicionadas'} ao carrinho`,
          life: 3000
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível adicionar ao carrinho. Verifique a disponibilidade.',
          life: 5000
        });
      }
    }
  }

  /**
   * Remove o item do carrinho.
   */
  removeFromCart(): void {
    const obj = this.object();
    if (!obj?.id) return;

    this.cartService.removeItem(obj.id);
    this.messageService.add({
      severity: 'info',
      summary: 'Removido',
      detail: 'Item removido do carrinho',
      life: 3000
    });
  }

  /**
   * Incrementa a quantidade para adicionar ao carrinho.
   */
  incrementCartQuantity(): void {
    const current = this.cartQuantity();
    const max = this.maxToAdd();
    if (current < max) {
      this.cartQuantity.set(current + 1);
    }
  }

  /**
   * Decrementa a quantidade para adicionar ao carrinho.
   */
  decrementCartQuantity(): void {
    const current = this.cartQuantity();
    if (current > 1) {
      this.cartQuantity.set(current - 1);
    }
  }

  /**
   * Navega para a tela de reserva com os itens do carrinho.
   * Inclui proteção contra cliques múltiplos (debounce).
   */
  goToReserva(): void {
    if (this.navigatingToReserva) return;

    this.navigatingToReserva = true;
    this.router.navigate(['/reserva/new'], {
      state: {cartItems: this.cartService.items()}
    });

    // Reset após navegação para permitir uso futuro (caso volte)
    this.navigationTimerId = setTimeout(() => {
      this.navigatingToReserva = false;
      this.navigationTimerId = null;
    }, NAVIGATION.DEBOUNCE_MS);
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.cancelGrupoRequest();
    this.cancelImagesRequest();
    this.cancelEmprestimosRequest();
    if (this.navigationTimerId) {
      clearTimeout(this.navigationTimerId);
    }
  }
}
