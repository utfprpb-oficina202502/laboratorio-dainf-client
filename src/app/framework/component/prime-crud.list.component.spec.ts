import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {ConfirmationService, MessageService} from 'primeng/api';
import {of} from 'rxjs';

import {PrimeCrudListComponent} from './prime-crud.list.component';
import {CrudService} from '../service/crud.service';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {PermissionService} from '../service/permission.service';
import {LoggerService} from '../service/logger.service';
import {TableExportService} from '../service/table-export.service';
import {TableStateManagerService} from '../service/table-state-manager.service';
import {TableKeyboardService} from '../service/table-keyboard.service';
import {TableColumnManagerService} from '../service/table-column-manager.service';
import {TableRowExpansionManagerService} from '../service/table-row-expansion-manager.service';
import {StorageService} from '../service/storage.service';
import {BreakpointService} from '../service/breakpoint.service';
import {Exception} from '../../exception/exception';

// Mock entity for testing
interface TestEntity {
  id: number;
  name: string;
}

// Concrete implementation for testing
@Component({
  template: '',
  standalone: true
})
class TestListComponent extends PrimeCrudListComponent<TestEntity, number> {
  protected override service = {} as CrudService<TestEntity, number>;
  protected override columnsTable = ['id', 'name', 'actions'];
  protected override urlForm = 'test/form';

  protected override getEntityName(): string {
    return 'Test';
  }

  protected override getEntityPluralName(): string {
    return 'Tests';
  }
}

describe('PrimeCrudListComponent', () => {
  let component: TestListComponent;
  let fixture: ComponentFixture<TestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestListComponent],
      providers: [
        { provide: CrudService, useValue: { findAllPaged: () => of({ content: [], totalElements: 0 }) } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: MessageService, useValue: {} },
        { provide: ConfirmationService, useValue: { confirm: jest.fn() } },
        { provide: LoaderService, useValue: { show: jest.fn(), hide: jest.fn() } },
        { provide: LoginService, useValue: {} },
        { provide: PermissionService, useValue: {
          canCreate: () => true,
          canEdit: () => true,
          canDelete: () => true,
          canExport: () => true,
          isReadOnly: () => false,
          userRole: () => 'ADMIN',
          isAlunoOrProfessor: () => false
        }},
        { provide: LoggerService, useValue: {} },
        { provide: TableExportService, useValue: {} },
        { provide: TableStateManagerService, useValue: { saveState: jest.fn() } },
        { provide: TableKeyboardService, useValue: {} },
        { provide: TableColumnManagerService, useValue: {} },
        { provide: TableRowExpansionManagerService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: BreakpointService, useValue: {
          isDesktop: () => true,
          isMobile: () => false,
          isTablet: () => false
        }},
        { provide: Exception, useValue: { addMessage: jest.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestListComponent);
    component = fixture.componentInstance;

    // Mock the actionsMenu viewChild
    const mockPopover = { toggle: jest.fn() };
    Object.defineProperty(component, 'actionsMenu', {
      value: () => mockPopover,
      writable: true
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openOptions method', () => {
    beforeEach(() => {
      // Reset contextMenuItems before each test
      component.contextMenuItems = [];
    });

    it('should create menu items for admin user (full permissions)', () => {
      const mockEvent = new Event('click');
      const mockItem: TestEntity = { id: 1, name: 'Test Item' };

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Editar');
      expect(component.contextMenuItems[0].icon).toBe('pi pi-pencil');
      expect(component.contextMenuItems[1].label).toBe('Remover');
      expect(component.contextMenuItems[1].icon).toBe('pi pi-trash');
    });

    it('should create view-only menu for read-only user', () => {
      // Override permission service for this test
      Object.defineProperty(component, 'isReadOnly', {
        value: () => true,
        writable: true
      });

      const mockEvent = new Event('click');
      const mockItem: TestEntity = { id: 1, name: 'Test Item' };

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(1);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
      expect(component.contextMenuItems[0].icon).toBe('pi pi-eye');
    });

    it('should create view-only menu for aluno/professor user', () => {
      // Override permission service for this test
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      const mockEvent = new Event('click');
      const mockItem: TestEntity = { id: 1, name: 'Test Item' };

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(1);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
      expect(component.contextMenuItems[0].icon).toBe('pi pi-eye');
    });

    it('should clear previous menu items', () => {
      component.contextMenuItems = [{ label: 'Old Item', icon: 'pi pi-old' }];

      const mockEvent = new Event('click');
      const mockItem: TestEntity = { id: 1, name: 'Test Item' };

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(2); // Should be cleared and have new items
      expect(component.contextMenuItems[0].label).toBe('Editar');
    });
  });

  describe('getItemId method', () => {
    it('should extract id from entity object', () => {
      const item: TestEntity = { id: 42, name: 'Test' };
      // Access protected method through type assertion
      expect((component as any).getItemId(item)).toBe(42);
    });

    it('should handle entities without id field', () => {
      const item = { customId: 123, name: 'Test' };
      // Access protected method through type assertion
      expect((component as any).getItemId(item)).toBeUndefined();
    });
  });
});
