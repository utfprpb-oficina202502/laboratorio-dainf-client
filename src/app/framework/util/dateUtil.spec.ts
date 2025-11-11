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
});

