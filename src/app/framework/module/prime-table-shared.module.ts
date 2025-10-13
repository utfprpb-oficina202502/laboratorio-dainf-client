import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

// PrimeNG Modules - Common imports for all list components
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

// Framework Components - Common for all lists
import {PrimeCrudToolbarComponent} from '../component/prime-crud-toolbar.component';
import {ActionButtonsComponent} from '../component/action-buttons.component';
import {TableFilterCaptionComponent} from '../component/table-filter-caption.component';
import {SkeletonTableComponent} from '../component/skeleton-table.component';
import {PrimeCrudTableWrapperComponent} from '../component/prime-crud-table-wrapper.component';

/**
 * Shared module for PrimeNG table list components
 * Consolidates common imports to reduce duplication across 13+ list components
 *
 * @usage Import this module instead of individual PrimeNG modules in list components
 * @savings ~117 lines of import statements across the codebase
 */
@NgModule({
  imports: [
    // Angular
    CommonModule,
    FormsModule,

    // PrimeNG
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

    // Framework Components
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,
    TableFilterCaptionComponent,
    SkeletonTableComponent,
    PrimeCrudTableWrapperComponent,
  ],
  exports: [
    // Export all to make them available to importing components
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
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,
    TableFilterCaptionComponent,
    SkeletonTableComponent,
    PrimeCrudTableWrapperComponent,
  ]
})
export class PrimeTableSharedModule {
}
