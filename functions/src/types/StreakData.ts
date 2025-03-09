import { Timestamp } from '@google-cloud/firestore';

export interface StreakData {
    createdAt: Timestamp;
    streak: {
      current: number;
      longest: number;
    };
  }