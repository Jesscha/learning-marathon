import { Timestamp } from "firebase-admin/firestore";

export interface CheckIn {
  userId: string;
  timestamp: Timestamp;
  photoUrl: string; // 파이어베이스 스토리지 URL
}
