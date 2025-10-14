import {ApplicationConfig, DEFAULT_CURRENCY_CODE, isDevMode, LOCALE_ID} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideServiceWorker} from '@angular/service-worker';
import {DatePipe} from '@angular/common';
import {ConfirmationService, MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';

import {routes} from './app.routes';
import {HttpClientInterceptor} from './http-client.interceptor';
import {LoginService} from './login/login.service';
import {LoaderService} from './framework/loader/loader.service';
import {ptBR} from '../locale/pt-BR';
import PrimeUTFPRPreset from './theme/prime-utfpr-theme-preset';

// Feature Services
import {UsuarioService} from './usuario/usuario.service';
import {CidadeService} from './cidade/cidade.service';
import {CompraService} from './compra/compra.service';
import {EmprestimoService} from './emprestimo/emprestimo.service';
import {EstadoService} from './estado/estado.service';
import {FornecedorService} from './fornecedor/fornecedor.service';
import {GrupoService} from './grupo/grupo.service';
import {HomeService} from './home/home.service';
import {ItemService} from './item/item.service';
import {RelatorioService} from './relatorio/relatorio.service';
import {ReservaService} from './reserva/reserva.service';
import {SaidaService} from './saida/saida.service';
import {SolicitacaoCompraService} from './solicitacaoCompra/solicitacaoCompra.service';
import {ValidationService} from './framework/validation/validation.service';
import {SidenavService} from './sidenav/sidenav.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router with BFCache optimization
    provideRouter(
      routes,
      // Enable scroll position restoration for BFCache compatibility
      // Restores scroll position when navigating back/forward
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    // Animations
    provideAnimations(),

    // HTTP Client
    provideHttpClient(withInterceptorsFromDi()),

    // Core Services
    MessageService,
    LoginService,
    ConfirmationService,
    LoaderService,
    DatePipe,

    // Feature Services
    UsuarioService,
    CidadeService,
    CompraService,
    EmprestimoService,
    EstadoService,
    FornecedorService,
    GrupoService,
    HomeService,
    ItemService,
    RelatorioService,
    ReservaService,
    SaidaService,
    SolicitacaoCompraService,
    ValidationService,
    SidenavService,

    // HTTP Interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpClientInterceptor,
      multi: true
    },

    // Locale Configuration
    {
      provide: LOCALE_ID,
      useValue: 'pt-BR'
    },
    {
      provide: DEFAULT_CURRENCY_CODE,
      useValue: 'BRL'
    },

    // PrimeNG Configuration
    providePrimeNG({
      theme: {
        preset: PrimeUTFPRPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.theme-dark',
          cssLayer: false
        }
      },
      translation: ptBR
    }),

    // Service Worker (PWA)
    // Enabled in production builds only (development uses isDevMode() check)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
