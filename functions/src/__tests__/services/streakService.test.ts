// Firebase firebase.ts 모킹
jest.mock('../../firebase', () => ({
  default: {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(),
      })),
    })),
  },
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  },
  storageBucket: {
    file: jest.fn(),
  },
}));

// Firebase Admin 모킹
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockStorage = {
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        createWriteStream: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    storage: jest.fn(() => mockStorage),
    credential: {
      applicationDefault: jest.fn(),
      cert: jest.fn(),
    },
    FieldValue: {
      serverTimestamp: jest.fn(),
    },
    Timestamp: {
      now: jest.fn(() => ({
        toDate: jest.fn(() => new Date()),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })),
      fromDate: jest.fn((date: Date) => ({
        toDate: jest.fn(() => date),
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      })),
    },
  };
});

// Firebase Functions 모킹
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Telegram Utils 모킹
jest.mock('../../utils/telegramUtils', () => ({
  sendMessage: jest.fn(),
}));

import {
  isRecoveryDay,
  expireRecoveryOpportunity,
} from '../../services/streakService';
import { getStreakData, updateStreak } from '../../utils/firebaseUtils';

// 모킹
jest.mock('../../utils/firebaseUtils');

const mockGetStreakData = getStreakData as jest.MockedFunction<typeof getStreakData>;
const mockUpdateStreak = updateStreak as jest.MockedFunction<typeof updateStreak>;

// Mock data types
interface MockStreakData {
  streak: {
    current: number;
    longest: number;
    previous?: number;
  };
  updatedAt: any;
}

// Date 모킹 헬퍼
const mockDate = (date: string | Date) => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  jest.useFakeTimers();
  jest.setSystemTime(targetDate);
};

const restoreDate = () => {
  jest.useRealTimers();
};

// Mock Firestore Timestamp helper
const createMockFirestoreTimestamp = (date: Date = new Date()) => ({
  toDate: jest.fn(() => date),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
});

describe('StreakService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreDate();
  });

  describe('isRecoveryDay', () => {
    it('스트릭이 0이 아니면 복구일이 아님', async () => {
      const mockData: MockStreakData = {
        streak: { current: 5, longest: 10, previous: undefined },
        updatedAt: createMockFirestoreTimestamp(),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      const result = await isRecoveryDay();
      expect(result).toBe(false);
    });

    it('previous가 없으면 복구일이 아님', async () => {
      const mockData: MockStreakData = {
        streak: { current: 0, longest: 10, previous: undefined },
        updatedAt: createMockFirestoreTimestamp(),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      const result = await isRecoveryDay();
      expect(result).toBe(false);
    });

    it('화요일(스트릭이 월요일에 끊어진 다음날)이면 복구일임', async () => {
      // 화요일로 설정 (2024-01-02)
      mockDate('2024-01-02T10:00:00+09:00');
      
      const yesterday = new Date('2024-01-01T23:59:59+09:00'); // 월요일
      const mockData: MockStreakData = {
        streak: { current: 0, longest: 10, previous: 7 },
        updatedAt: createMockFirestoreTimestamp(yesterday),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      const result = await isRecoveryDay();
      expect(result).toBe(true);
    });

    it('일요일이면 복구일이 아님', async () => {
      // 일요일로 설정 (2024-01-07)
      mockDate('2024-01-07T10:00:00+09:00');
      
      const yesterday = new Date('2024-01-06T23:59:59+09:00'); // 토요일
      const mockData: MockStreakData = {
        streak: { current: 0, longest: 10, previous: 7 },
        updatedAt: createMockFirestoreTimestamp(yesterday),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      const result = await isRecoveryDay();
      expect(result).toBe(false);
    });
  });

  describe('expireRecoveryOpportunity', () => {
    it('복구 기회가 있을 때 previous 값을 제거함', async () => {
      const mockData: MockStreakData = {
        streak: { current: 0, longest: 10, previous: 7 },
        updatedAt: createMockFirestoreTimestamp(),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      await expireRecoveryOpportunity();
      
      expect(mockUpdateStreak).toHaveBeenCalledWith(0, 10, undefined);
    });

    it('복구 기회가 없을 때는 아무것도 하지 않음', async () => {
      const mockData: MockStreakData = {
        streak: { current: 0, longest: 10, previous: undefined },
        updatedAt: createMockFirestoreTimestamp(),
      };
      mockGetStreakData.mockResolvedValue(mockData);

      await expireRecoveryOpportunity();
      
      expect(mockUpdateStreak).not.toHaveBeenCalled();
    });
  });
}); 