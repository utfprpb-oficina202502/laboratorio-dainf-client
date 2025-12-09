import {ChangeDetectionStrategy, Component} from '@angular/core';

import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-card',
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-card">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p-skeleton width="60%" height="1rem" class="mb-2"></p-skeleton>
          <p-skeleton width="40%" height="2rem"></p-skeleton>
        </div>
        <p-skeleton shape="circle" size="3rem"></p-skeleton>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      background: var(--p-content-background, #ffffff);
      border: 1px solid var(--p-content-border-color, #e2e8f0);
      border-radius: var(--p-content-border-radius, 0.5rem);
      padding: 1rem;
      box-shadow: var(--p-card-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }
  `]
})
export class SkeletonCardComponent {}
