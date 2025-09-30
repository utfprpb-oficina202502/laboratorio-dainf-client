import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  protected readonly loaderService = inject(LoaderService);

  protected readonly loading = this.loaderService.loading;
}
