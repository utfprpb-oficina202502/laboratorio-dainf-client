import {StringUtils} from './string.utils';

export class CpfCnpjUtil {

  public static cpfIsValid(valor: string | number): boolean {
    if (/^(.)\1+$/.test(valor.toString())) {
      return false;
    }
    valor = valor.toString();
    valor = valor.replace(/[^0-9]/g, '');
    const digitos = valor.substr(0, 9);
    let novo_cpf = CpfCnpjUtil.calculaDigitosPorPosicao(digitos);
    novo_cpf = CpfCnpjUtil.calculaDigitosPorPosicao(novo_cpf, 11);
    return novo_cpf === valor;
  }

  public static cnpjIsValid(valor: string | number): boolean {
    if (/^(.)\1+$/.test(valor.toString())) {
      return false;
    }
    valor = valor.toString();
    valor = valor.replace(/[^0-9]/g, '');

    const cnpj_original = valor;
    const primeiros_numeros_cnpj = valor.substr(0, 12);
    const primeiro_calculo = CpfCnpjUtil.calculaDigitosPorPosicao(primeiros_numeros_cnpj, 5);
    const segundo_calculo = CpfCnpjUtil.calculaDigitosPorPosicao(primeiro_calculo, 6);
    return segundo_calculo === cnpj_original;
  }

  public static isValid(valor: string | number): boolean {
    if (StringUtils.isBlank(valor.toString())) {
      return false;
    }

    const valida = CpfCnpjUtil.verificaSeEhCpfOuCnpj(valor);
    valor = valor.toString();
    valor = valor.replace(/[^0-9]/g, '');

    if (valida === 'CPF') {
      return CpfCnpjUtil.cpfIsValid(valor);
    } else if (valida === 'CNPJ') {
      return CpfCnpjUtil.cnpjIsValid(valor);
    }

    return false;
  }

  private static verificaSeEhCpfOuCnpj(valor: string | number): string {
    valor = valor.toString();
    valor = valor.replace(/[^0-9]/g, '');
    if (valor.length === 11) {
      return 'CPF';
    } else if (valor.length === 14) {
      return 'CNPJ';
    } else {
      return '';
    }
  }

  private static calculaDigitosPorPosicao(digitos: string | number, posicoes = 10, soma_digitos = 0): string {
    digitos = digitos.toString();
    for (let i = 0; i < digitos.length; i++) {
      soma_digitos = soma_digitos + (Number(digitos[i]) * posicoes);
      posicoes--;
      if (posicoes < 2) {
        posicoes = 9;
      }
    }

    soma_digitos = soma_digitos % 11;

    if (soma_digitos < 2) {
      soma_digitos = 0;
    } else {
      soma_digitos = 11 - soma_digitos;
    }

    return digitos + soma_digitos;
  }

}
