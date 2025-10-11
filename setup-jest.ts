// jest-preset-angular setup para Angular 20
import {setupZoneTestEnv} from 'jest-preset-angular/setup-env/zone';
import {getTestBed} from '@angular/core/testing';

// Importa serializers do jest-preset-angular para snapshots mais limpos
// - html-comment: remove comentários HTML gerados pelo Angular
// - ng-snapshot: formata componentes Angular para snapshots legíveis
// - no-ng-attributes: remove atributos internos do Angular (ng-version, _ngcontent, etc)
import 'jest-preset-angular/build/serializers/html-comment';
import 'jest-preset-angular/build/serializers/ng-snapshot';
import 'jest-preset-angular/build/serializers/no-ng-attributes';

// Initialize the Angular testing environment with protection against duplicate initialization
try {
  setupZoneTestEnv();
} catch (e) {
  getTestBed().resetTestEnvironment();
  setupZoneTestEnv();
}
