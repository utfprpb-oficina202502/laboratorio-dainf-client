import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ConfiguracoesService, Configuracoes } from './configuracoes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule]
})
export class ConfiguracoesComponent implements OnInit {
  protected readonly nadaConstaEmail = signal('');
  protected readonly isLoading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal('');

  protected readonly configuracoesService = inject(ConfiguracoesService);
  protected readonly router = inject(Router);

  ngOnInit(): void {
    this.carregarConfiguracoes();
  }

  carregarConfiguracoes() {
    this.isLoading.set(true);
    this.configuracoesService.getConfiguracoes().subscribe({
      next: (config: Configuracoes) => {
        this.nadaConstaEmail.set(config.nadaConstaEmail || '');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  enviar() {
    this.isLoading.set(true);
    this.success.set(false);
    this.error.set('');
    this.configuracoesService.salvarConfiguracoes({ nadaConstaEmail: this.nadaConstaEmail() }).subscribe({
      next: () => {
        this.success.set(true);
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set('Erro ao salvar: ' + (err?.error?.message || ''));
        this.isLoading.set(false);
      }
    });
  }

  cancelar() {
    this.carregarConfiguracoes();
    this.success.set(false);
    this.error.set('');
  }
}
