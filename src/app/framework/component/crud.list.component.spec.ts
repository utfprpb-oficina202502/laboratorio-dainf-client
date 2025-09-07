/**
 * ----------------------------------------------------------------------------
 * Unit tests for CrudListComponent
 * Testing library/framework detected: Jasmine + Karma (Angular)
 * ----------------------------------------------------------------------------
 * These tests focus on the public methods and behaviors defined in this file,
 * covering success and failure paths, pagination, filtering, deletion flows,
 * responsive columns, and bottom-sheet actions.
 */

describe('CrudListComponent (unit)', () => {
  // Minimal service and dependency stubs using Jasmine spies
  class DummyCrudService {
    findAllPaged = jasmine.createSpy('findAllPaged');
    findAllByUsername = jasmine.createSpy('findAllByUsername');
    delete = jasmine.createSpy('delete');
  }
  class DummyLoaderService {
    display = jasmine.createSpy('display');
  }
  class DummyLoginService {
    userLoggedIsAlunoOrProfessor = jasmine.createSpy('userLoggedIsAlunoOrProfessor');
  }
  class DummyBottomSheetRef {
    afterDismissed() { return of(undefined as any); }
  }
  class DummyBottomSheet {
    open = jasmine.createSpy('open').and.returnValue(new DummyBottomSheetRef());
  }

  // Concrete subclass for testing the abstract CrudListComponent
  class TestCrudListComponent extends CrudListComponent<any, number> {
    public postFindAll = jasmine.createSpy('postFindAll');
  }

  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  function create(opts?: {
    pageResp?: any;
    pageError?: boolean;
    byUserResp?: any[];
    deleteError?: boolean;
    deleteResp?: any;
    bottomAction?: any;        // 'E' | 'R' | undefined
    width?: number;            // window.innerWidth override
    loginResolve?: boolean;    // value for userLoggedIsAlunoOrProfessor()
  }) {
    const svc = new DummyCrudService();
    const loader = new DummyLoaderService();
    const login = new DummyLoginService();
    const bottom = new DummyBottomSheet();

    // Defaults
    const defaultPage = { content: [], totalElements: 0, size: 10, number: 0 };
    if (opts?.pageError) {
      svc.findAllPaged.and.returnValue(throwError(() => new Error('load failed')));
    } else {
      svc.findAllPaged.and.returnValue(of(opts?.pageResp ?? defaultPage));
    }
    svc.findAllByUsername.and.returnValue(of(opts?.byUserResp ?? []));
    if (opts?.deleteError) {
      svc.delete.and.returnValue(throwError(() => new Error('delete failed')));
    } else {
      svc.delete.and.returnValue(of(opts?.deleteResp ?? {}));
    }

    if (opts?.bottomAction !== undefined) {
      bottom.open.and.returnValue({ afterDismissed: () => of(opts.bottomAction) } as any);
    }

    login.userLoggedIsAlunoOrProfessor.and.returnValue(Promise.resolve(!!opts?.loginResolve));

    if (typeof opts?.width === 'number') {
      // Spy on window.innerWidth getter for responsive tests
      spyOnProperty(window as any, 'innerWidth', 'get').and.returnValue(opts.width);
    }

    // Stub Swal and Exception behaviors
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ value: true } as any));
    spyOn(Exception, 'addMessage');

    // Injector stub mapping tokens to our fakes
    const injectorStub = {
      get: (token: any) => {
        if (token === Router) return routerSpy;
        if (token === MessageService) return {} as any;
        if (token === ConfirmationService) return {} as any;
        if (token === MatBottomSheet) return bottom as any;
        if (token === LoaderService) return loader as any;
        if (token === LoginService) return login as any;
        return null;
      }
    } as any;

    const cols = ['id', 'name', 'actions'];
    const comp = new TestCrudListComponent(svc as any, injectorStub, cols, '/form-url');

    return { comp, svc, loader, login, bottom };
  }

  beforeEach(() => {
    routerSpy.navigate.calls.reset();
  });

  it('should initialize displayedColumns from provided columns', () => {
    const { comp } = create();
    expect(comp.displayedColumns).toEqual(['id', 'name', 'actions']);
  });

  it('ngOnInit should set isAlunoOrProfessor and call findAll', async () => {
    const { comp } = create({ loginResolve: true });
    const spyFindAll = spyOn(comp, 'findAll').and.callThrough();
    comp.ngOnInit();
    await Promise.resolve(); // allow login promise to resolve
    expect(comp.isAlunoOrProfessor).toBeTrue();
    expect(spyFindAll).toHaveBeenCalled();
  });

  it('findAll (success) updates pagination, objects, dataSource, hides loader, calls postFindAll and buildColumnsTable', () => {
    const page = { content: [{ a: 1 }], totalElements: 1, size: 5, number: 2 };
    const { comp, loader } = create({ pageResp: page, width: 1300 });
    const spyBuildColumns = spyOn(comp, 'buildColumnsTable').and.callThrough();

    comp.findAll();

    expect(loader.display).toHaveBeenCalledWith(true);
    expect(comp.objects).toEqual(page.content);
    expect(comp.totalElements).toBe(1);
    expect(comp.pageSize).toBe(5);
    expect(comp.pageIndex).toBe(2);
    expect(comp.dataSource).toBeTruthy();
    expect(comp.dataSource.data).toEqual(page.content);
    expect(loader.display).toHaveBeenCalledWith(false);
    expect((comp as any).postFindAll).toHaveBeenCalled();
    expect(spyBuildColumns).toHaveBeenCalled();
  });

  it('findAll (error) hides loader and still triggers buildColumnsTable without mutating state', () => {
    const { comp, loader } = create({ pageError: true });
    const spyBuildColumns = spyOn(comp, 'buildColumnsTable').and.callThrough();

    comp.findAll();

    expect(loader.display).toHaveBeenCalledWith(true);
    expect(loader.display).toHaveBeenCalledWith(false);
    expect(comp.objects as any).toBeUndefined();
    expect(comp.dataSource as any).toBeUndefined();
    expect(spyBuildColumns).toHaveBeenCalled();
  });

  it('onPageChange fetches page and updates component pagination', () => {
    const page = { content: ['x'], totalElements: 10, size: 25, number: 3 };
    const { comp, svc, loader } = create({ pageResp: page });
    const evt = { pageIndex: 3, pageSize: 25 } as PageEvent;

    comp.onPageChange(evt);

    expect(svc.findAllPaged).toHaveBeenCalledWith(3, 25, '');
    expect(comp.objects).toEqual(page.content);
    expect(comp.pageIndex).toBe(3);
    expect(comp.pageSize).toBe(25);
    expect(loader.display).toHaveBeenCalledWith(false);
  });

  it('applyFilter uses provided filter and updates list', () => {
    const page = { content: ['a', 'b'], totalElements: 2, size: 10, number: 0 };
    const { comp, svc } = create({ pageResp: page });

    comp.applyFilter('abc');

    expect(svc.findAllPaged).toHaveBeenCalledWith(comp.pageIndex, comp.pageSize, 'abc');
    expect(comp.objects).toEqual(page.content);
    expect(comp.dataSource.data).toEqual(page.content);
  });

  it('findAllByUsername reads username from localStorage and populates objects', () => {
    spyOn(localStorage, 'getItem').and.returnValue('user1');
    const { comp, svc, loader } = create({ byUserResp: [{ id: 1 }, { id: 2 }] });

    comp.findAllByUsername();

    expect(svc.findAllByUsername).toHaveBeenCalledWith('user1');
    expect(comp.objects).toEqual([{ id: 1 }, { id: 2 }]);
    expect(comp.dataSource.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(loader.display).toHaveBeenCalledWith(false);
  });

  it('buildList sets dataSource only when objects is non-null', () => {
    const { comp } = create();
    comp.objects = null as any;
    comp.buildList();
    expect(comp.dataSource as any).toBeUndefined();

    comp.objects = [{ k: 1 }] as any;
    comp.buildList();
    expect(comp.dataSource).toBeTruthy();
    expect(comp.dataSource.data).toEqual([{ k: 1 }]);
  });

  it('edit navigates to [urlForm, id]', () => {
    const { comp } = create();
    comp.edit(123);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/form-url', 123]);
  });

  it('openForm navigates to [urlForm]', () => {
    const { comp } = create();
    comp.openForm();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/form-url']);
  });

  it('delete: when cancelled, should not call service.delete', async () => {
    const { comp, svc } = create();
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false } as any));

    comp.delete(7);
    await Promise.resolve(); // allow promise chain to resolve

    expect(svc.delete).not.toHaveBeenCalled();
  });

  it('delete: when confirmed and succeeds, should call delete, refresh list, and show success alert', async () => {
    const { comp, svc, loader } = create();
    const spyFindAll = spyOn(comp, 'findAll').and.callThrough();
    (Swal.fire as jasmine.Spy).and.returnValues(
      Promise.resolve({ value: true } as any), // confirmation dialog
      Promise.resolve({} as any)               // success dialog
    );

    comp.delete(9);
    await Promise.resolve();

    expect(loader.display).toHaveBeenCalledWith(true);
    expect(svc.delete).toHaveBeenCalledWith(9);
    expect(spyFindAll).toHaveBeenCalled();
    expect(loader.display).toHaveBeenCalledWith(false);
    expect((Swal.fire as jasmine.Spy).calls.count()).toBeGreaterThan(1);
  });

  it('delete: when confirmed but service fails, should hide loader and show error via Exception.addMessage', async () => {
    const { comp } = create({ deleteError: true });
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true } as any));

    comp.delete(11);
    await Promise.resolve();

    expect(Exception.addMessage).toHaveBeenCalled();
  });

  it('openBottomSheet with action "E" should call edit(id)', () => {
    const { comp, bottom } = create({ bottomAction: 'E', width: 800 });
    const spyEdit = spyOn(comp, 'edit');

    comp.openBottomSheet(44);

    expect(bottom.open).toHaveBeenCalled();
    expect(spyEdit).toHaveBeenCalledWith(44);
  });

  it('openBottomSheet with action "R" should call delete(id)', () => {
    const { comp, bottom } = create({ bottomAction: 'R', width: 800 });
    const spyDelete = spyOn(comp, 'delete').and.stub();

    comp.openBottomSheet(55);

    expect(bottom.open).toHaveBeenCalled();
    expect(spyDelete).toHaveBeenCalledWith(55);
  });

  it('buildColumnsTable removes "actions" when width <= 1200 and adds it back when width > 1200', () => {
    const { comp } = create({ width: 1000 }); // small width
    comp.buildColumnsTable();
    expect(comp['columnsTable'].includes('actions')).toBeFalse();

    // Now large width
    (spyOnProperty(window as any, 'innerWidth', 'get') as any).and.returnValue(1400);
    comp.buildColumnsTable();
    expect(comp['columnsTable'].includes('actions')).toBeTrue();
  });

  it('buildColumnsTable does nothing when hostListenerColumnEnable is false', () => {
    const { comp } = create({ width: 900 });
    comp.hostListenerColumnEnable = false;
    const before = [...comp['columnsTable']];
    comp.buildColumnsTable();
    expect(comp['columnsTable']).toEqual(before);
  });

  it('showError delegates to Exception.addMessage', () => {
    const { comp } = create();
    const err = new Error('boom');
    comp.showError(err as any);
    expect(Exception.addMessage).toHaveBeenCalledWith(err as any);
  });
});