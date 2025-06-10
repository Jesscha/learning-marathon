import { Timestamp } from '@google-cloud/firestore';

export interface StreakData {
    updatedAt: Timestamp;
    streak: {
      current: number;
      longest: number;
      previous?: number;
    };
  }