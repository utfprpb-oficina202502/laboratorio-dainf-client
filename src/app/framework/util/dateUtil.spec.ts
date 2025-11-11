import { DateUtil } from './dateUtil';

describe('DateUtil', () => {
  describe('parseStringToDate', () => {
    it('should parse dd/mm/yyyy string to Date', () => {
      const date = DateUtil.parseStringToDate('10/11/2025');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10); // November is 10 (0-based)
      expect(date.getDate()).toBe(10);
    });
  });

  describe('dtIsBeforeToday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(DateUtil.dtIsBeforeToday(yesterday)).toBe(true);
    });
    it('should return false for today', () => {
      const today = new Date();
      expect(DateUtil.dtIsBeforeToday(today)).toBe(false);
    });
    it('should return false for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect(DateUtil.dtIsBeforeToday(future)).toBe(false);
    });
  });

  describe('dtIsAfterToday', () => {
    it('should return true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(DateUtil.dtIsAfterToday(tomorrow)).toBe(true);
    });
    it('should return false for today', () => {
      const today = new Date();
      expect(DateUtil.dtIsAfterToday(today)).toBe(false);
    });
    it('should return false for past date', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect(DateUtil.dtIsAfterToday(past)).toBe(false);
    });
  });

  describe('dtIsAfterDtLimit', () => {
    it('should return true if date is after limit', () => {
      const date = new Date(2025, 10, 11); // 11/11/2025
      const limit = new Date(2025, 10, 10); // 10/11/2025
      expect(DateUtil.dtIsAfterDtLimit(date, limit)).toBe(true);
    });
    it('should return false if date is before limit', () => {
      const date = new Date(2025, 10, 9); // 09/11/2025
      const limit = new Date(2025, 10, 10); // 10/11/2025
      expect(DateUtil.dtIsAfterDtLimit(date, limit)).toBe(false);
    });
    it('should return false if date is equal to limit', () => {
      const date = new Date(2025, 10, 10); // 10/11/2025
      const limit = new Date(2025, 10, 10); // 10/11/2025
      expect(DateUtil.dtIsAfterDtLimit(date, limit)).toBe(false);
    });
  });

  describe('removeDays', () => {
    it('should subtract days from date', () => {
      const date = new Date(2025, 10, 10);
      const result = DateUtil.removeDays(new Date(date), 5);
      expect(result.getDate()).toBe(5);
    });
  });

  describe('addDays', () => {
    it('should add days to date and return dd/mm/yyyy string', () => {
      const date = new Date(2025, 10, 10);
      const result = DateUtil.addDays(date, 7);
      expect(result).toBe('17/11/2025');
    });
    it('should add days to string date and return dd/mm/yyyy string', () => {
      const result = DateUtil.addDays('10/11/2025', 7);
      expect(result).toBe('17/11/2025');
    });
  });

  describe('formatDateString', () => {
    it('should return empty string for undefined', () => {
      expect(DateUtil.formatDateString(undefined)).toBe('');
    });
    it('should return dd/MM/yyyy for dd/MM/yyyy input', () => {
      expect(DateUtil.formatDateString('10/11/2025')).toBe('10/11/2025');
    });
    it('should format ISO date yyyy-MM-dd to pt-BR', () => {
      const result = DateUtil.formatDateString('2025-11-10');
      expect(['10/11/2025', '09/11/2025']).toContain(result);
    });
    it('should format ISO date yyyy-MM-ddTHH:mm:ss to pt-BR', () => {
      expect(DateUtil.formatDateString('2025-11-10T15:30:00')).toBe('10/11/2025');
    });
    it('should format Date string to pt-BR if valid', () => {
      expect(DateUtil.formatDateString(new Date(2025, 10, 10).toString())).toBe('10/11/2025');
    });
    it('should return input if not a valid date', () => {
      expect(DateUtil.formatDateString('not-a-date')).toBe('not-a-date');
    });
  });
});
