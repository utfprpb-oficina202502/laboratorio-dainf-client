import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-card',
  imports: [CommonModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p-skeleton width="60%" height="1rem" class="mb-2"></p-skeleton>
          <p-skeleton width="40%" height="2rem"></p-skeleton>
        </div>
        <p-skeleton shape="circle" size="3rem"></p-skeleton>
      </div>
    </div>
  `,
  styles: []
})
export class SkeletonCardComponent {}
