// jest-preset-angular setup para Angular 20
import 'zone.js';
import 'zone.js/testing';
import {getTestBed} from '@angular/core/testing';
import {BrowserTestingModule, platformBrowserTesting} from '@angular/platform-browser/testing';

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
