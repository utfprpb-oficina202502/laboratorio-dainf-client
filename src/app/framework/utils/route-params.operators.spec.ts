import {
  extractRouteParam,
  parseBooleanParam,
  parseCodeParam,
  parseNumericId,
  parsePositiveId,
  parseStringParam
} from './route-params.operators';
import {of} from 'rxjs';
import {TestScheduler} from 'rxjs/testing';

describe('Route Params Operators', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('parseNumericId', () => {
    it('deve converter strings numéricas válidas', () => {
      expect(parseNumericId('123')).toBe(123);
      expect(parseNumericId('0')).toBe(0);
      expect(parseNumericId('999999')).toBe(999999);
      expect(parseNumericId('42')).toBe(42);
    });

    it('deve aceitar números decimais', () => {
      expect(parseNumericId('12.34')).toBe(12.34);
      expect(parseNumericId('0.5')).toBe(0.5);
      expect(parseNumericId('3.14159')).toBe(3.14159);
    });

    it('deve aceitar números negativos', () => {
      expect(parseNumericId('-5')).toBe(-5);
      expect(parseNumericId('-123.45')).toBe(-123.45);
    });

    it('deve retornar null para valores inválidos', () => {
      expect(parseNumericId('abc')).toBeNull();
      expect(parseNumericId('12abc')).toBeNull();
      expect(parseNumericId('NaN')).toBeNull();
      expect(parseNumericId('undefined')).toBeNull();
      expect(parseNumericId('null')).toBeNull();
    });

    it('deve retornar null para strings vazias ou whitespace', () => {
      expect(parseNumericId('')).toBeNull();
      expect(parseNumericId(' ')).toBeNull();
      expect(parseNumericId('   ')).toBeNull();
      expect(parseNumericId('\t')).toBeNull();
      expect(parseNumericId('\n')).toBeNull();
    });

    it('deve fazer trim antes de converter', () => {
      expect(parseNumericId('  123  ')).toBe(123);
      expect(parseNumericId('\t42\n')).toBe(42);
    });
  });

  describe('parseStringParam', () => {
    it('deve retornar strings válidas com trim', () => {
      expect(parseStringParam('test')).toBe('test');
      expect(parseStringParam('  test  ')).toBe('test');
      expect(parseStringParam('\tvalue\n')).toBe('value');
      expect(parseStringParam('hello world')).toBe('hello world');
    });

    it('deve retornar null para strings vazias', () => {
      expect(parseStringParam('')).toBeNull();
      expect(parseStringParam('   ')).toBeNull();
      expect(parseStringParam('\t\n')).toBeNull();
    });

    it('deve preservar caracteres especiais', () => {
      expect(parseStringParam('test@123')).toBe('test@123');
      expect(parseStringParam('código-especial')).toBe('código-especial');
      expect(parseStringParam('value_with_underscore')).toBe('value_with_underscore');
    });
  });

  describe('parseCodeParam', () => {
    it('deve retornar códigos válidos com trim', () => {
      expect(parseCodeParam('ABC123')).toBe('ABC123');
      expect(parseCodeParam('  CODE  ')).toBe('CODE');
      expect(parseCodeParam('test-code')).toBe('test-code');
    });

    it('deve retornar null para códigos vazios', () => {
      expect(parseCodeParam('')).toBeNull();
      expect(parseCodeParam('   ')).toBeNull();
    });
  });

  describe('parsePositiveId', () => {
    it('deve retornar apenas números positivos', () => {
      expect(parsePositiveId('1')).toBe(1);
      expect(parsePositiveId('123')).toBe(123);
      expect(parsePositiveId('999')).toBe(999);
    });

    it('deve rejeitar zero e negativos', () => {
      expect(parsePositiveId('0')).toBeNull();
      expect(parsePositiveId('-1')).toBeNull();
      expect(parsePositiveId('-123')).toBeNull();
    });

    it('deve rejeitar valores inválidos', () => {
      expect(parsePositiveId('abc')).toBeNull();
      expect(parsePositiveId('')).toBeNull();
      expect(parsePositiveId('  ')).toBeNull();
    });

    it('deve aceitar decimais positivos', () => {
      expect(parsePositiveId('1.5')).toBe(1.5);
      expect(parsePositiveId('0.1')).toBe(0.1);
    });

    it('deve rejeitar decimais não-positivos', () => {
      expect(parsePositiveId('0.0')).toBeNull();
      expect(parsePositiveId('-0.5')).toBeNull();
    });
  });

  describe('parseBooleanParam', () => {
    it('deve converter "true" para boolean true', () => {
      expect(parseBooleanParam('true')).toBe(true);
      expect(parseBooleanParam('TRUE')).toBe(true);
      expect(parseBooleanParam('True')).toBe(true);
      expect(parseBooleanParam('  true  ')).toBe(true);
    });

    it('deve converter "1" para boolean true', () => {
      expect(parseBooleanParam('1')).toBe(true);
      expect(parseBooleanParam('  1  ')).toBe(true);
    });

    it('deve converter "false" para boolean false', () => {
      expect(parseBooleanParam('false')).toBe(false);
      expect(parseBooleanParam('FALSE')).toBe(false);
      expect(parseBooleanParam('False')).toBe(false);
      expect(parseBooleanParam('  false  ')).toBe(false);
    });

    it('deve converter "0" para boolean false', () => {
      expect(parseBooleanParam('0')).toBe(false);
      expect(parseBooleanParam('  0  ')).toBe(false);
    });

    it('deve retornar null para valores inválidos', () => {
      expect(parseBooleanParam('yes')).toBeNull();
      expect(parseBooleanParam('no')).toBeNull();
      expect(parseBooleanParam('2')).toBeNull();
      expect(parseBooleanParam('abc')).toBeNull();
      expect(parseBooleanParam('')).toBeNull();
    });
  });

  describe('extractRouteParam operator', () => {
    describe('extração bem-sucedida', () => {
      it('deve extrair ID numérico válido', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '123'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: 123});
        });
      });

      it('deve extrair código string válido', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {code: 'ABC123'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'code',
              converter: parseStringParam
            })
          );

          expectObservable(result$).toBe(expected, {a: 'ABC123'});
        });
      });

      it('deve fazer trim de valores antes de converter', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '  123  '}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: 123});
        });
      });
    });

    describe('valores inválidos', () => {
      it('deve retornar null para ID inválido', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: 'invalid'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: null});
        });
      });

      it('deve retornar null para parâmetro ausente', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: null});
        });
      });

      it('deve retornar null para string vazia', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: ''}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: null});
        });
      });

      it('deve retornar null para whitespace', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '   '}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: null});
        });
      });
    });

    describe('callback onError', () => {
      it('deve chamar onError para valor inválido', (done) => {
        const onErrorSpy = jest.fn();

        of({id: 'invalid'}).pipe(
          extractRouteParam({
            paramName: 'id',
            converter: parseNumericId,
            onError: onErrorSpy
          })
        ).subscribe(() => {
          expect(onErrorSpy).toHaveBeenCalledWith('invalid');
          done();
        });
      });

      it('não deve chamar onError para valor válido', (done) => {
        const onErrorSpy = jest.fn();

        of({id: '123'}).pipe(
          extractRouteParam({
            paramName: 'id',
            converter: parseNumericId,
            onError: onErrorSpy
          })
        ).subscribe(() => {
          expect(onErrorSpy).not.toHaveBeenCalled();
          done();
        });
      });

      it('deve chamar onError com erro se converter lançar exceção', (done) => {
        const onErrorSpy = jest.fn();
        const throwingConverter = () => {
          throw new Error('Conversion error');
        };

        of({value: 'test'}).pipe(
          extractRouteParam({
            paramName: 'value',
            converter: throwingConverter,
            onError: onErrorSpy
          })
        ).subscribe(() => {
          expect(onErrorSpy).toHaveBeenCalled();
          expect(onErrorSpy).toHaveBeenCalledWith('test', expect.any(Error));
          done();
        });
      });
    });

    describe('valor padrão', () => {
      it('deve usar defaultValue quando conversão falha', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: 'invalid'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId,
              defaultValue: 0
            })
          );

          expectObservable(result$).toBe(expected, {a: 0});
        });
      });

      it('deve usar defaultValue para parâmetro ausente', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'page',
              converter: parseNumericId,
              defaultValue: 1
            })
          );

          expectObservable(result$).toBe(expected, {a: 1});
        });
      });

      it('deve usar valor convertido em vez de defaultValue quando válido', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '123'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId,
              defaultValue: 0
            })
          );

          expectObservable(result$).toBe(expected, {a: 123});
        });
      });
    });

    describe('auto-unsubscribe', () => {
      it('deve se desinscrever automaticamente após primeira emissão', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a-b-c', {
            a: {id: '1'},
            b: {id: '2'},
            c: {id: '3'}
          });
          const expected = '(a|)'; // Apenas primeiro valor

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: 1});
        });
      });

      it('deve completar o observable após take(1)', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a-b-c-|', {
            a: {id: '1'},
            b: {id: '2'},
            c: {id: '3'}
          });
          const expected = '(a|)'; // Completa imediatamente

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: 1});
        });
      });
    });

    describe('casos edge', () => {
      it('deve lidar com múltiplos parâmetros na rota', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '123', code: 'ABC', page: '5'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'code',
              converter: parseStringParam
            })
          );

          expectObservable(result$).toBe(expected, {a: 'ABC'});
        });
      });

      it('deve lidar com valores numéricos como zero', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {id: '0'}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'id',
              converter: parseNumericId
            })
          );

          expectObservable(result$).toBe(expected, {a: 0});
        });
      });

      it('deve lidar com parâmetros que contêm apenas espaços', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const params$ = cold('a|', {a: {code: '     '}});
          const expected = '(a|)';

          const result$ = params$.pipe(
            extractRouteParam({
              paramName: 'code',
              converter: parseStringParam
            })
          );

          expectObservable(result$).toBe(expected, {a: null});
        });
      });
    });
  });
});
