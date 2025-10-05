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
}
