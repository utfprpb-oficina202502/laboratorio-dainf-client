import {Component, ElementRef, inject, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Relatorio} from './relatorio';
import {RelatorioService} from './relatorio.service';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {SelectItem} from 'primeng/api';
import {environment} from '../../environments/environment';
import {RelatorioParams} from './relatorioParams';
import {StringUtils} from '../framework/util/string.utils';
import {Table, TableModule} from 'primeng/table';

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {FieldsetModule} from 'primeng/fieldset';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';

// Custom components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';

@Component({
    selector: 'app-form-relatorio',
    templateUrl: './relatorio.form.component.html',
    styleUrls: ['./relatorio.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // Still needed for nested parameters form
    // PrimeNG
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    DialogModule,
    FieldsetModule,
    FileUploadModule,
    DatePickerModule,
    SelectModule,
    // Custom
    VoltarComponent,
    SalvarComponent,
    CancelarComponent
  ]
})
export class RelatorioFormComponent extends PrimeReactiveCrudFormComponent<Relatorio, number> {
  protected override service = inject(RelatorioService);
  protected override urlList = '/relatorio';
  // View children
  readonly table = viewChild.required<Table>('table');
  // File upload tracking
  uploadedFiles: File[] = [];
  protected override type = Relatorio;
  readonly fileUpload = viewChild.required<FileUpload>('fileUpload');
  readonly nomeParam = viewChild.required<ElementRef>('nomeParam');
  // Dropdown options (must be before currentParam initialization)
  protected readonly tipoParamDropdown: SelectItem[] = [
    {label: 'String', value: 'S'},
    {label: 'Number', value: 'N'},
    {label: 'Date', value: 'D'},
  ];

  // State signals
  protected readonly paramsList = signal<RelatorioParams[]>([]);
  protected readonly currentParam = signal<RelatorioParams>(this.createEmptyParam());
  protected readonly uploadCallback = signal<(() => void) | null>(null);
  private readonly fb = inject(FormBuilder);

  constructor() {
    super();
  }

  /**
   * Called when file upload completes
   */
  onUpload(): void {
    const callback = this.uploadCallback();
    if (callback) {
      callback();
      this.uploadCallback.set(null);
    }
  }

  /**
   * Get URL for file upload with relatorio ID
   */
  getUrlUploadImages(): string {
    const obj = this.object();
    return `${environment.api_url}relatorio/upload-file-report?idRelatorio=${obj?.id ?? ''}`;
  }

  /**
   * Update currentParam name
   */
  updateParamName(value: string): void {
    this.currentParam.update(p => ({...p, nameParam: value}));
  }

  /**
   * Update currentParam alias
   */
  updateParamAlias(value: string): void {
    this.currentParam.update(p => ({...p, aliasParam: value}));
  }

  /**
   * Update currentParam type
   */
  updateParamType(value: string): void {
    this.currentParam.update(p => ({...p, tipoParam: value}));
  }

  /**
   * Insert parameter into list
   */
  insertParam(): void {
    const param = this.currentParam();

    if (StringUtils.isNotBlank(param.tipoParam)
      && StringUtils.isNotBlank(param.nameParam)
      && StringUtils.isNotBlank(param.aliasParam)) {

      // Add to signal list
      this.paramsList.update(list => [...list, {...param}]);

      // Reset current parameter
      this.currentParam.set(this.createEmptyParam());

      // Focus on name input
      setTimeout(() => {
        this.nomeParam().nativeElement.focus();
      }, 0);
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!'
      });
    }
  }

  /**
   * Remove parameter from list
   */
  removeParam(nameParam: string): void {
    this.paramsList.update(list =>
      list.filter(param => param.nameParam !== nameParam)
    );
  }

  /**
   * Override save to validate file requirement
   */
  override save(): void {
    const fileUploadComponent = this.fileUpload();
    const isEditing = this.isEditing();

    // Custom validation: new reports must have a file
    if (!isEditing && (!fileUploadComponent || fileUploadComponent.files.length === 0)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'É necessário anexar um arquivo JRXML para cadastrar um novo relatório!'
      });
      return;
    }

    // Call parent save
    super.save();
  }

  /**
   * Build the reactive form
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      nome: [null, [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Initialize values after data loading
   */
  protected override initializeValues(): void {
    const obj = this.object();
    if (obj?.paramsList) {
      this.paramsList.set([...obj.paramsList]);
    }
  }

  /**
   * Patch form after loading existing relatorio
   */
  protected override patchFormWithObject(object: Relatorio): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome
      });
    }

    // Set parameters list
    if (object.paramsList) {
      this.paramsList.set([...object.paramsList]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Relatorio>): Partial<Relatorio> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      paramsList: this.paramsList()
    };
  }

  /**
   * Hook after successful save - triggers file upload
   */
  protected override postSave(callback: () => void): void {
    const fileUploadComponent = this.fileUpload();
    if (fileUploadComponent && fileUploadComponent.files.length > 0) {
      fileUploadComponent.url = this.getUrlUploadImages();
      this.uploadCallback.set(callback);
      fileUploadComponent.upload();
    } else {
      callback();
    }
  }

  /**
   * Create empty parameter with default values
   */
  private createEmptyParam(): RelatorioParams {
    const param = new RelatorioParams();
    param.tipoParam = this.tipoParamDropdown[0].value;
    return param;
  }
}
