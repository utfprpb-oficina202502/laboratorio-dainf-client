import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoaderService } from './loader.service';
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProgressSpinner
  ]
})
export class LoaderComponent {
  protected readonly loaderService = inject(LoaderService);

  protected readonly loading = this.loaderService.loading;
}
