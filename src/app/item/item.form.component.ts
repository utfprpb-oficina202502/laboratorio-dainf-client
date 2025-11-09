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
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Z_INDEX} from '../framework/constants';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from './item';
import {ItemService} from './item.service';
import {Grupo} from '../grupo/grupo';
import {GrupoService} from '../grupo/grupo.service';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {environment} from '../../environments/environment';
import {ItemImage} from './itemImage';
import {LoggerService} from '../framework/services/logger.service';
import {ConfirmationService} from 'primeng/api';

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
import {TooltipModule} from "primeng/tooltip";

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
    NgOptimizedImage,
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
    TooltipModule,
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
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  private grupoSubscription?: Subscription;
  private imagesSubscription?: Subscription;
  protected readonly logger = inject(LoggerService);
  private readonly confirmationService = inject(ConfirmationService);

  // Signals for component state
  protected readonly grupoList = signal<Grupo[]>([]);
  protected readonly tipoItemOptions = signal<TipoItemOption[]>([
    { label: 'Consumo', value: 'C' },
    { label: 'Permanente', value: 'P' }
  ]);
  protected readonly dialogImagens = signal(false);
  protected readonly images = signal<ItemImage[]>([]);
  protected readonly loadingImages = signal(false);
  protected readonly minioUrl = signal(environment.minio_url);

  protected readonly responsiveOptions = [
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

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
   * Find grupos for autocomplete
   */
  findGrupos($event: AutoCompleteCompleteEvent): void {
    this.cancelGrupoRequest();

    this.grupoSubscription = this.grupoService.complete($event.query).subscribe({
      next: (grupos) => {
        this.grupoList.set(grupos);
      },
      error: (error) => {
        this.logger.error('Error fetching grupos', error);
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
    if (upload) {
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
      message: 'Tem certeza que deseja remover a imagem? A ação não poderá ser desfeita.',
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
   * Handle patrimonio change
   */
  onPatrimonioChange(): void {
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
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.cancelGrupoRequest();
    this.cancelImagesRequest();
  }
}
