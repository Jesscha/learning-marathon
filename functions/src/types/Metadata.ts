
export interface Metadata {
    lastAllCheckIn: {
      timestamp: FirebaseFirestore.Timestamp;
      dayId: string;
    };
    streak: {
      current: number;
      longest: number;
    };
  }