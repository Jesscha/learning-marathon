import { 
  getWorkingDayInfo, 
  isWorkingDay,
  getTodayDateString,
  getYesterdayDateString 
} from '../../utils/dateUtils';

// Date 모킹 헬퍼
const mockDate = (date: string | Date) => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  jest.useFakeTimers();
  jest.setSystemTime(targetDate);
};

const restoreDate = () => {
  jest.useRealTimers();
};

describe('DateUtils', () => {
  afterEach(() => {
    restoreDate();
  });

  describe('getWorkingDayInfo', () => {
    it('월요일은 근무일임', () => {
      const monday = new Date('2024-01-01T10:00:00Z'); // 월요일
      const result = getWorkingDayInfo(monday);
      expect(result.isWorking).toBe(true);
      expect(result.dayName).toBe('월요일');
    });

    it('수요일은 근무일임', () => {
      const wednesday = new Date('2024-01-03T10:00:00Z'); // 수요일
      const result = getWorkingDayInfo(wednesday);
      expect(result.isWorking).toBe(true);
      expect(result.dayName).toBe('수요일');
    });

    it('금요일은 근무일임', () => {
      const friday = new Date('2024-01-05T10:00:00Z'); // 금요일
      const result = getWorkingDayInfo(friday);
      expect(result.isWorking).toBe(true);
      expect(result.dayName).toBe('금요일');
    });

    it('화요일은 근무일이 아님', () => {
      const tuesday = new Date('2024-01-02T10:00:00Z'); // 화요일
      const result = getWorkingDayInfo(tuesday);
      expect(result.isWorking).toBe(false);
      expect(result.dayName).toBe('화요일');
    });

    it('목요일은 근무일이 아님', () => {
      const thursday = new Date('2024-01-04T10:00:00Z'); // 목요일
      const result = getWorkingDayInfo(thursday);
      expect(result.isWorking).toBe(false);
      expect(result.dayName).toBe('목요일');
    });

    it('토요일은 근무일이 아님', () => {
      const saturday = new Date('2024-01-06T10:00:00Z'); // 토요일
      const result = getWorkingDayInfo(saturday);
      expect(result.isWorking).toBe(false);
      expect(result.dayName).toBe('토요일');
    });

    it('일요일은 근무일이 아님', () => {
      const sunday = new Date('2024-01-07T10:00:00Z'); // 일요일
      const result = getWorkingDayInfo(sunday);
      expect(result.isWorking).toBe(false);
      expect(result.dayName).toBe('일요일');
    });
  });

  describe('isWorkingDay', () => {
    it('월/수/금은 근무일임', () => {
      expect(isWorkingDay(new Date('2024-01-01T10:00:00Z'))).toBe(true); // 월
      expect(isWorkingDay(new Date('2024-01-03T10:00:00Z'))).toBe(true); // 수
      expect(isWorkingDay(new Date('2024-01-05T10:00:00Z'))).toBe(true); // 금
    });

    it('화/목/토/일은 근무일이 아님', () => {
      expect(isWorkingDay(new Date('2024-01-02T10:00:00Z'))).toBe(false); // 화
      expect(isWorkingDay(new Date('2024-01-04T10:00:00Z'))).toBe(false); // 목
      expect(isWorkingDay(new Date('2024-01-06T10:00:00Z'))).toBe(false); // 토
      expect(isWorkingDay(new Date('2024-01-07T10:00:00Z'))).toBe(false); // 일
    });
  });

  describe('getTodayDateString', () => {
    it('YYYY-MM-DD 형식으로 날짜를 반환함', () => {
      mockDate('2024-01-15T10:00:00+09:00'); // KST 시간대 명시
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2024-01-15');
    });
  });

  describe('getYesterdayDateString', () => {
    it('어제 날짜를 YYYY-MM-DD 형식으로 반환함', () => {
      mockDate('2024-01-15T10:00:00+09:00'); // KST 시간대 명시
      const result = getYesterdayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2024-01-14');
    });

    it('월 경계를 올바르게 처리함', () => {
      mockDate('2024-02-01T10:00:00+09:00'); // 2월 1일 KST
      const result = getYesterdayDateString();
      expect(result).toBe('2024-01-31'); // 1월 31일
    });

    it('연도 경계를 올바르게 처리함', () => {
      mockDate('2024-01-01T10:00:00+09:00'); // 새해 첫날 KST
      const result = getYesterdayDateString();
      expect(result).toBe('2023-12-31'); // 작년 마지막 날
    });
  });
}); 