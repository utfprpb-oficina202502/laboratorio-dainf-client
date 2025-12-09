import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {CadastroRapidoComponent} from './cadastroRapido.component';
import {createServiceMock} from '../../framework/testing/test-helpers';

describe('CadastroRapidoComponent', () => {
  let component: CadastroRapidoComponent;
  let fixture: ComponentFixture<CadastroRapidoComponent>;
  let mockRouter: jest.Mocked<Partial<Router>>;

  beforeEach(async () => {
    mockRouter = createServiceMock<Router>(['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [CadastroRapidoComponent],
      providers: [
        {provide: Router, useValue: mockRouter}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroRapidoComponent);
    component = fixture.componentInstance;
  });

  describe('fullRoute', () => {
    it('deve retornar rota completa quando href e id estão definidos', () => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.componentRef.setInput('id', 123);
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('/item/form/123');
    });

    it('deve retornar apenas href quando id não está definido', () => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('/item/form');
    });

    it('deve retornar string vazia quando href não está definido', () => {
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('');
    });

    it('deve retornar apenas href quando id é 0', () => {
      fixture.componentRef.setInput('href', '/grupo/form');
      fixture.componentRef.setInput('id', 0);
      fixture.detectChanges();

      // 0 é falsy, então não deve ser incluído na rota
      expect(component.fullRoute()).toBe('/grupo/form');
    });

    it('deve lidar com diferentes tipos de rotas', () => {
      fixture.componentRef.setInput('href', '/fornecedor/form');
      fixture.componentRef.setInput('id', 999);
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('/fornecedor/form/999');
    });
  });

  describe('onClick - navegação SPA', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.componentRef.setInput('id', 42);
      fixture.detectChanges();
    });

    it('deve navegar via router quando clique normal (sem modificadores)', () => {
      const event = createMouseEvent({});

      component.onClick(event);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/item/form/42');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('não deve navegar quando rota está vazia', () => {
      fixture.componentRef.setInput('href', '');
      fixture.componentRef.setInput('id', undefined);
      fixture.detectChanges();

      const event = createMouseEvent({});

      component.onClick(event);

      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('onClick - abertura em nova aba', () => {
    let windowOpenSpy: jest.SpyInstance;

    beforeEach(() => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.componentRef.setInput('id', 42);
      fixture.detectChanges();

      windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      windowOpenSpy.mockRestore();
    });

    it('deve abrir nova aba quando Ctrl+Click', () => {
      const event = createMouseEvent({ctrlKey: true});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith('/item/form/42', '_blank', 'noopener,noreferrer');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('deve abrir nova aba quando Cmd+Click (metaKey)', () => {
      const event = createMouseEvent({metaKey: true});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith('/item/form/42', '_blank', 'noopener,noreferrer');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('deve abrir nova aba quando Shift+Click', () => {
      const event = createMouseEvent({shiftKey: true});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith('/item/form/42', '_blank', 'noopener,noreferrer');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('deve abrir nova aba quando clique com botão do meio (auxclick)', () => {
      const event = createMouseEvent({button: 1});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith('/item/form/42', '_blank', 'noopener,noreferrer');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('deve abrir nova aba quando múltiplos modificadores estão ativos', () => {
      const event = createMouseEvent({ctrlKey: true, shiftKey: true});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith('/item/form/42', '_blank', 'noopener,noreferrer');
    });
  });

  describe('segurança', () => {
    let windowOpenSpy: jest.SpyInstance;

    beforeEach(() => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.componentRef.setInput('id', 1);
      fixture.detectChanges();

      windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      windowOpenSpy.mockRestore();
    });

    it('deve incluir noopener,noreferrer para prevenir tabnabbing', () => {
      const event = createMouseEvent({ctrlKey: true});

      component.onClick(event);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('edge cases', () => {
    it('deve lidar com href undefined e id definido', () => {
      fixture.componentRef.setInput('id', 123);
      fixture.detectChanges();

      // href undefined retorna '', então fullRoute será '/123' - na verdade será '123'
      // Mas como href || '' retorna '', e entityId existe, será '/123'
      expect(component.fullRoute()).toBe('/123');
    });

    it('deve funcionar corretamente após mudança de inputs', () => {
      fixture.componentRef.setInput('href', '/item/form');
      fixture.componentRef.setInput('id', 1);
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('/item/form/1');

      // Muda os inputs
      fixture.componentRef.setInput('href', '/grupo/form');
      fixture.componentRef.setInput('id', 99);
      fixture.detectChanges();

      expect(component.fullRoute()).toBe('/grupo/form/99');
    });
  });
});

/**
 * Factory para criar MouseEvent mockado para testes.
 * @param options Opções do evento (ctrlKey, metaKey, shiftKey, button)
 */
function createMouseEvent(options: {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  button?: number;
}): MouseEvent {
  return {
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    shiftKey: options.shiftKey || false,
    button: options.button ?? 0,
    preventDefault: jest.fn()
  } as unknown as MouseEvent;
}
