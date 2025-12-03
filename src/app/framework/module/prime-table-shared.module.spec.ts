import { TestBed } from '@angular/core/testing';
import { PrimeTableSharedModule } from './prime-table-shared.module';

// Import all the components and modules that should be exported
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { PopoverModule } from 'primeng/popover';
import { MenuModule } from 'primeng/menu';

describe('PrimeTableSharedModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PrimeTableSharedModule]
    });
  });

  it('should create', () => {
    expect(PrimeTableSharedModule).toBeDefined();
  });

  describe('Module Exports', () => {
    it('should export PrimeNG CardModule', () => {
      const module = TestBed.inject(CardModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG TableModule', () => {
      const module = TestBed.inject(TableModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG MultiSelectModule', () => {
      const module = TestBed.inject(MultiSelectModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG ToolbarModule', () => {
      const module = TestBed.inject(ToolbarModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG ButtonModule', () => {
      const module = TestBed.inject(ButtonModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG InputTextModule', () => {
      const module = TestBed.inject(InputTextModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG IconFieldModule', () => {
      const module = TestBed.inject(IconFieldModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG InputIconModule', () => {
      const module = TestBed.inject(InputIconModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG TooltipModule', () => {
      const module = TestBed.inject(TooltipModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG TagModule', () => {
      const module = TestBed.inject(TagModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG PopoverModule', () => {
      const module = TestBed.inject(PopoverModule);
      expect(module).toBeDefined();
    });

    it('should export PrimeNG MenuModule', () => {
      const module = TestBed.inject(MenuModule);
      expect(module).toBeDefined();
    });
  });

  describe('Module Integration', () => {
    it('should provide all necessary dependencies for list components', () => {
      // Test that all required modules are available for components that import this module
      expect(() => {
        TestBed.inject(CardModule);
        TestBed.inject(TableModule);
        TestBed.inject(PopoverModule);
        TestBed.inject(MenuModule);
      }).not.toThrow();
    });

    it('should support popover functionality', () => {
      // Verify that popover-related modules are properly exported
      const popoverModule = TestBed.inject(PopoverModule);
      const menuModule = TestBed.inject(MenuModule);

      expect(popoverModule).toBeDefined();
      expect(menuModule).toBeDefined();
    });
  });
});
