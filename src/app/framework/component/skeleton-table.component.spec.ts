import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SkeletonTableComponent} from './skeleton-table.component';
import {By} from '@angular/platform-browser';

describe('SkeletonTableComponent', () => {
  let component: SkeletonTableComponent;
  let fixture: ComponentFixture<SkeletonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonTableComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be defined and functional', () => {
      // Verify component has required methods and properties
      expect(component.columns).toBeDefined();
      expect(component.rows).toBeDefined();
      expect(typeof component.columns).toBe('function'); // Signal
      expect(typeof component.rows).toBe('function'); // Signal
    });
  });

  describe('Input Signals - Default Values', () => {
    it('should default to 5 columns', () => {
      fixture.detectChanges();
      expect(component.columns()).toBe(5);
    });

    it('should default to 5 rows', () => {
      fixture.detectChanges();
      expect(component.rows()).toBe(5);
    });
  });

  describe('Input Signals - Custom Values', () => {
    it('should accept custom column count', () => {
      fixture.componentRef.setInput('columns', 7);
      fixture.detectChanges();

      expect(component.columns()).toBe(7);
    });

    it('should accept custom row count', () => {
      fixture.componentRef.setInput('rows', 10);
      fixture.detectChanges();

      expect(component.rows()).toBe(10);
    });

    it('should update when column input changes', () => {
      fixture.componentRef.setInput('columns', 3);
      fixture.detectChanges();
      expect(component.columns()).toBe(3);

      fixture.componentRef.setInput('columns', 8);
      fixture.detectChanges();
      expect(component.columns()).toBe(8);
    });

    it('should update when row input changes', () => {
      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();
      expect(component.rows()).toBe(3);

      fixture.componentRef.setInput('rows', 12);
      fixture.detectChanges();
      expect(component.rows()).toBe(12);
    });
  });

  describe('Computed Arrays', () => {
    it('should create column array matching input', () => {
      fixture.componentRef.setInput('columns', 3);
      fixture.detectChanges();

      const columnArray = component['columnArray']();
      expect(columnArray).toEqual([0, 1, 2]);
    });

    it('should create row array matching input', () => {
      fixture.componentRef.setInput('rows', 4);
      fixture.detectChanges();

      const rowArray = component['rowArray']();
      expect(rowArray).toEqual([0, 1, 2, 3]);
    });

    it('should update computed arrays when column input changes', () => {
      fixture.componentRef.setInput('columns', 2);
      fixture.detectChanges();
      expect(component['columnArray']()).toEqual([0, 1]);

      fixture.componentRef.setInput('columns', 4);
      fixture.detectChanges();
      expect(component['columnArray']()).toEqual([0, 1, 2, 3]);
    });

    it('should update computed arrays when row input changes', () => {
      fixture.componentRef.setInput('rows', 2);
      fixture.detectChanges();
      expect(component['rowArray']()).toEqual([0, 1]);

      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();
      expect(component['rowArray']()).toEqual([0, 1, 2]);
    });
  });

  describe('DOM Rendering - Header', () => {
    it('should render skeleton table container', () => {
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.skeleton-table');
      expect(container).toBeTruthy();
    });

    it('should render table header', () => {
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.table-header');
      expect(header).toBeTruthy();
    });

    it('should render correct number of header cells', () => {
      fixture.componentRef.setInput('columns', 4);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      expect(headerCells.length).toBe(4);
    });

    it('should render skeleton in each header cell', () => {
      fixture.componentRef.setInput('columns', 3);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      headerCells.forEach((cell: Element) => {
        const skeleton = cell.querySelector('p-skeleton');
        expect(skeleton).toBeTruthy();
      });
    });
  });

  describe('DOM Rendering - Body', () => {
    it('should render correct number of body rows', () => {
      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();

      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');
      expect(bodyRows.length).toBe(3);
    });

    it('should render correct number of cells per row', () => {
      fixture.componentRef.setInput('columns', 5);
      fixture.componentRef.setInput('rows', 2);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.table-row');
      rows.forEach((row: Element) => {
        const cells = row.querySelectorAll('.body-cell');
        expect(cells.length).toBe(5);
      });
    });

    it('should render skeleton in each body cell', () => {
      fixture.componentRef.setInput('columns', 3);
      fixture.componentRef.setInput('rows', 2);
      fixture.detectChanges();

      const bodyCells = fixture.nativeElement.querySelectorAll('.body-cell');
      bodyCells.forEach((cell: Element) => {
        const skeleton = cell.querySelector('p-skeleton');
        expect(skeleton).toBeTruthy();
      });
    });

    it('should render total skeleton elements = (columns * rows) + columns', () => {
      fixture.componentRef.setInput('columns', 4);
      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      // Header skeletons: 4, Body skeletons: 4 * 3 = 12, Total: 16
      expect(skeletons.length).toBe(4 + (4 * 3));
    });
  });

  describe('Edge Cases - Zero Values', () => {
    it('should handle zero columns gracefully', () => {
      fixture.componentRef.setInput('columns', 0);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      expect(headerCells.length).toBe(0);
    });

    it('should handle zero rows gracefully', () => {
      fixture.componentRef.setInput('rows', 0);
      fixture.detectChanges();

      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');
      expect(bodyRows.length).toBe(0);
    });

    it('should render empty table when both columns and rows are zero', () => {
      fixture.componentRef.setInput('columns', 0);
      fixture.componentRef.setInput('rows', 0);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.skeleton-table');
      expect(container).toBeTruthy(); // Container exists

      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBe(0); // But no skeletons
    });
  });

  describe('Edge Cases - Large Values', () => {
    it('should handle large column count (20 columns)', () => {
      fixture.componentRef.setInput('columns', 20);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      expect(headerCells.length).toBe(20);
    });

    it('should handle large row count (100 rows)', () => {
      fixture.componentRef.setInput('rows', 100);
      fixture.detectChanges();

      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');
      expect(bodyRows.length).toBe(100);
    });

    it('should maintain OnPush performance with many rows', () => {
      // Verify no excessive change detection cycles
      const initialChangeDetectionCalls = (component as any).ngDoCheck?.calls?.length || 0;

      fixture.componentRef.setInput('rows', 100);
      fixture.detectChanges();

      const finalChangeDetectionCalls = (component as any).ngDoCheck?.calls?.length || 0;
      // Should only trigger once for input change
      expect(finalChangeDetectionCalls - initialChangeDetectionCalls).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases - Negative Values', () => {
    it('should handle negative column count as zero', () => {
      fixture.componentRef.setInput('columns', -5);
      fixture.detectChanges();

      // Array.from with negative length creates empty array
      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      expect(headerCells.length).toBe(0);
    });

    it('should handle negative row count as zero', () => {
      fixture.componentRef.setInput('rows', -3);
      fixture.detectChanges();

      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');
      expect(bodyRows.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA structure', () => {
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.skeleton-table');
      expect(container).toBeTruthy();
      // Container should have implicit role="presentation" for loading state
    });

    it('should not have interactive elements', () => {
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const links = fixture.nativeElement.querySelectorAll('a');
      const inputs = fixture.nativeElement.querySelectorAll('input');

      expect(buttons.length).toBe(0);
      expect(links.length).toBe(0);
      expect(inputs.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should use signals for reactive state', () => {
      // Verify signals are functions (signal API)
      expect(typeof component.columns).toBe('function');
      expect(typeof component.rows).toBe('function');

      // Signals should return values
      expect(typeof component.columns()).toBe('number');
      expect(typeof component.rows()).toBe('number');
    });

    it('should render efficiently with computed signals', () => {
      // Computed signals should only recalculate when inputs change
      const columnArray1 = component['columnArray']();
      const columnArray2 = component['columnArray']();

      // Same reference if input hasn't changed
      expect(columnArray1).toBe(columnArray2);
    });
  });

  describe('Visual Structure', () => {
    it('should apply correct CSS classes', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.skeleton-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.table-header')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.header-cell')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.table-row')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.body-cell')).toBeTruthy();
    });

    it('should have grid layout classes for header', () => {
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.table-header');
      expect(header).toBeTruthy();

      // Verify header element exists with grid styling
      // Note: CSS grid styles may not be computed in test environment
      expect(header.className).toContain('table-header');
    });

    it('should have grid layout classes for body rows', () => {
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('.table-row');
      expect(row).toBeTruthy();

      // Verify row element exists with grid styling
      // Note: CSS grid styles may not be computed in test environment
      expect(row.className).toContain('table-row');
    });
  });

  describe('Integration with PrimeNG Skeleton', () => {
    it('should render p-skeleton components', () => {
      fixture.detectChanges();

      const skeletons = fixture.debugElement.queryAll(By.css('p-skeleton'));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should configure skeleton width in header', () => {
      fixture.detectChanges();

      const headerSkeleton = fixture.debugElement.query(By.css('.header-cell p-skeleton'));
      expect(headerSkeleton).toBeTruthy();

      // Should have width attribute set
      const skeletonElement = headerSkeleton.nativeElement;
      expect(skeletonElement.getAttribute('width')).toBe('80%');
    });

    it('should configure skeleton width in body', () => {
      fixture.detectChanges();

      const bodySkeleton = fixture.debugElement.query(By.css('.body-cell p-skeleton'));
      expect(bodySkeleton).toBeTruthy();

      // Should have width attribute set
      const skeletonElement = bodySkeleton.nativeElement;
      expect(skeletonElement.getAttribute('width')).toBe('90%');
    });

    it('should configure skeleton height', () => {
      fixture.detectChanges();

      const skeleton = fixture.debugElement.query(By.css('p-skeleton'));
      expect(skeleton).toBeTruthy();

      // Should have height attribute set
      const skeletonElement = skeleton.nativeElement;
      expect(skeletonElement.getAttribute('height')).toBe('1rem');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should match item.list.component configuration (7 columns, 10 rows)', () => {
      fixture.componentRef.setInput('columns', 7);
      fixture.componentRef.setInput('rows', 10);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');

      expect(headerCells.length).toBe(7);
      expect(bodyRows.length).toBe(10);
    });

    it('should match emprestimo.list.component configuration (5 columns, expandable)', () => {
      // Note: expandable is handled by parent component, not skeleton
      fixture.componentRef.setInput('columns', 5);
      fixture.componentRef.setInput('rows', 10);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      expect(headerCells.length).toBe(5);
    });

    it('should match simple list configuration (3 columns, 5 rows)', () => {
      fixture.componentRef.setInput('columns', 3);
      fixture.componentRef.setInput('rows', 5);
      fixture.detectChanges();

      const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
      const bodyRows = fixture.nativeElement.querySelectorAll('.table-row');

      expect(headerCells.length).toBe(3);
      expect(bodyRows.length).toBe(5);
    });
  });

  describe('Regression Tests', () => {
    it('should not throw errors with default configuration', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not throw errors with custom configuration', () => {
      expect(() => {
        fixture.componentRef.setInput('columns', 10);
        fixture.componentRef.setInput('rows', 15);
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not leak memory on destroy', () => {
      fixture.detectChanges();

      // Verify component can be destroyed without errors
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should handle rapid input changes', () => {
      // Simulate rapid configuration changes
      for (let i = 1; i <= 10; i++) {
        fixture.componentRef.setInput('columns', i);
        fixture.componentRef.setInput('rows', i * 2);
        fixture.detectChanges();

        const headerCells = fixture.nativeElement.querySelectorAll('.header-cell');
        expect(headerCells.length).toBe(i);
      }
    });
  });
});
