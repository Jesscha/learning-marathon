import { Timestamp } from "firebase-admin/firestore";

export interface Day {
    timestamp: Timestamp;
    id: string; // YYYY-MM-DD 형식
  }