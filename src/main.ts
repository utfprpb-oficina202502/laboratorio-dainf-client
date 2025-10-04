import {enableProdMode} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {registerLocaleData} from '@angular/common';
import localePt from '@angular/common/locales/pt';

import {AppComponent} from './app/app.component';
import {appConfig} from './app/app.config';
import {environment} from './environments/environment';

// Register pt-BR locale
registerLocaleData(localePt, 'pt-BR');

// Enable production mode if environment is production
if (environment.production) {
  enableProdMode();
}

// Bootstrap application with centralized configuration
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
