export class DateUtil {

  static parseStringToDate(dtToParse: string): Date {
    const aux = dtToParse.split('/');
    return new Date(Number(aux[2]), Number(aux[1]) - 1, Number(aux[0]));
  }

  static dtIsBeforeToday(dt: Date | string): boolean {
    const dtCompare: Date = typeof dt === 'string' ? this.parseStringToDate(dt) : dt;
    return dtCompare.getTime() < Date.now();
  }

  static dtIsAfterToday(dt: Date | string): boolean {
    const dtCompare: Date = typeof dt === 'string' ? this.parseStringToDate(dt) : dt;
    return dtCompare.getTime() > Date.now();
  }

  static dtIsAfterDtLimit(dt: Date | string, dtLimite: Date | string): boolean {
    const dtCompare: Date = typeof dt === 'string' ? this.parseStringToDate(dt) : dt;
    const dtLimit: Date = typeof dtLimite === 'string' ? this.parseStringToDate(dtLimite) : dtLimite;
    return dtCompare.getTime() > dtLimit.getTime();
  }

  public static removeDays(date: Date, days: number): Date {
    date.setDate(date.getDate() - days);
    return date;
  }

  static addDays(date: Date | string, days: number): string {
    const d: Date = typeof date === 'string' ? this.parseStringToDate(date) : new Date(date);
    d.setDate(d.getDate() + days);
    // Retorna no formato dd/mm/yyyy
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formata uma string de data para o padrão dd/MM/yyyy (pt-BR).
   * Aceita formatos ISO, dd/MM/yyyy, yyyy-MM-ddTHH:mm:ss, ou tenta converter para Date.
   * @param dateStr string | undefined
   * @returns string
   */
  static formatDateString(dateStr: string | undefined): string {
    if (!dateStr) return '';
    // Se já estiver no formato ISO, converte para Date
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    }
    // Se estiver no formato dd/MM/yyyy, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    // Se estiver no formato yyyy-MM-ddTHH:mm:ss, extrai só a data
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    }
    // Tenta converter para Date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
    return dateStr;
  }
}
