// jest-preset-angular setup para Angular 20
import {setupZoneTestEnv} from 'jest-preset-angular/setup-env/zone';
import {getTestBed} from '@angular/core/testing';

// Initialize the Angular testing environment with protection against duplicate initialization
try {
  setupZoneTestEnv();
} catch (e) {
  getTestBed().resetTestEnvironment();
  setupZoneTestEnv();
}
