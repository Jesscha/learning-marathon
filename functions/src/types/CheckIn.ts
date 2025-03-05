import { Timestamp } from "firebase-admin/firestore";

export interface CheckIn {
  userId: string;
  userFirstName: string;
  userLastName: string;
  photoUrl: string; // 파이어베이스 스토리지 URL
  chatId: string;
  content: string;
  timestamp: Timestamp;
}
