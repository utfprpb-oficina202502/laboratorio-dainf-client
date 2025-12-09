import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-chart',
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-chart">
      <p-skeleton width="50%" height="1.5rem" class="mb-4"></p-skeleton>
      <div>
        @switch (type()) {
          @case ('line') {
            <!-- Line Chart -->
            <div class="space-y-2">
              <div class="flex items-end gap-2 h-32">
                @for (item of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track item) {
                  <p-skeleton
                    [width]="'calc(' + (100 / 10) + '% - 0.5rem)'"
                    [height]="getRandomHeight()"
                    styleClass="flex-shrink-0">
                  </p-skeleton>
                }
              </div>
              <p-skeleton width="100%" height="0.5rem"></p-skeleton>
            </div>
          }
          @case ('bar') {
            <!-- Bar Chart -->
            <div class="space-y-2">
              <div class="flex items-end gap-2 h-32">
                @for (item of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track item) {
                  <p-skeleton
                    [width]="'calc(' + (100 / 10) + '% - 0.5rem)'"
                    [height]="getRandomHeight()"
                    styleClass="flex-shrink-0">
                  </p-skeleton>
                }
              </div>
              <p-skeleton width="100%" height="0.5rem"></p-skeleton>
            </div>
          }
          @case ('pie') {
            <!-- Pie Chart -->
            <div class="flex items-center justify-center">
              <p-skeleton shape="circle" size="10rem"></p-skeleton>
            </div>
            <div class="mt-4 space-y-2">
              @for (item of [1, 2, 3]; track item) {
                <div class="flex items-center gap-2">
                  <p-skeleton shape="circle" size="1rem"></p-skeleton>
                  <p-skeleton width="60%" height="0.75rem"></p-skeleton>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .skeleton-chart {
      background: var(--p-content-background, #ffffff);
      border: 1px solid var(--p-content-border-color, #e2e8f0);
      border-radius: var(--p-content-border-radius, 0.5rem);
      padding: 1rem;
      box-shadow: var(--p-card-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }
  `]
})
export class SkeletonChartComponent {
  readonly type = input<'line' | 'bar' | 'pie'>('line');

  getRandomHeight(): string {
    const heights = ['40%', '60%', '80%', '100%', '70%', '50%'];
    return heights[Math.floor(Math.random() * heights.length)];
  }
}
