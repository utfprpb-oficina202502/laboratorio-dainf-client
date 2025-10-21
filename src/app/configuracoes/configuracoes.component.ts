import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
export class ConfiguracoesComponent implements OnInit, OnDestroy {
  protected readonly nadaConstaEmail = signal('');
  protected readonly isLoading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal('');

  // Getters públicos para testes e template
  getNadaConstaEmail() { return this.nadaConstaEmail(); }
  setNadaConstaEmail(val: string) { this.nadaConstaEmail.set(val); }
  getIsLoading() { return this.isLoading(); }
  getSuccess() { return this.success(); }
  getError() { return this.error(); }
  // Getter público para facilitar testes
  getCdr() { return this.cdr; }

  protected readonly configuracoesService = inject(ConfiguracoesService);
  protected readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroyed = false;

  constructor() {
    // No dependency injection here; use inject() for all dependencies
  }

  ngOnInit(): void {
    this.carregarConfiguracoes();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  carregarConfiguracoes() {
    this.isLoading.set(true);
    this.configuracoesService.getConfiguracoes().subscribe({
      next: (config: Configuracoes) => {
        this.nadaConstaEmail.set(config.nadaConstaEmail || '');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
        setTimeout(() => {
          if (!this.destroyed) {
            this.cdr.markForCheck();
            this.router.navigate(['/']);
          }
        }, 1200); // 1.2s delay for feedback
      },
      error: (err) => {
        this.error.set('Erro ao salvar: ' + (err?.error?.message || ''));
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  cancelar() {
    this.carregarConfiguracoes();
    this.success.set(false);
    this.error.set('');
    this.cdr.markForCheck();
  }
}
