import { db } from '../firebase';
import { Day } from '../types/Day';
import { CheckIn } from '../types/CheckIn';
import { User } from '../types/User';
import { Timestamp } from "firebase-admin/firestore";

// 컬렉션 레퍼런스
export const daysCollection = db.collection('Days');
export const metadataCollection = db.collection('Metadata');
export const usersCollection = db.collection('Users');

// 사용자 관련 함수
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const snapshot = await usersCollection.where('telegramId', '==', telegramId).limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as User;
}

export async function createUser(userData: User): Promise<string> {
  const userRef = await usersCollection.add(userData);
  return userRef.id;
}

// 체크인 관련 함수
export async function addCheckIn(dayId: string, checkInData: CheckIn): Promise<string> {
  const checkInRef = await daysCollection.doc(dayId).collection('checkins').add(checkInData);
  return checkInRef.id;
}

export async function getDayCheckins(dayId: string): Promise<CheckIn[]> {
  const snapshot = await daysCollection.doc(dayId).collection('checkins').get();
  return snapshot.docs.map(doc => doc.data() as CheckIn);
}

// 메타데이터 관련 함수
export async function updateStreak(userId: string, newStreak: number): Promise<void> {
  const userRef = usersCollection.doc(userId);
  const userData = await userRef.get();
  
  if (userData.exists) {
    const currentLongest = userData.data()?.streak?.longest || 0;
    
    await userRef.update({
      'streak.current': newStreak,
      'streak.longest': Math.max(currentLongest, newStreak)
    });
  }
}

// 날짜 관련 함수
export async function getOrCreateDay(dateString: string): Promise<Day> {
  const dayRef = daysCollection.doc(dateString);
  const dayDoc = await dayRef.get();
  
  if (!dayDoc.exists) {
    const newDay: Day = {
      id: dateString,
      timestamp: Timestamp.now()
    };
    
    await dayRef.set(newDay);
    return newDay;
  }
  
  return dayDoc.data() as Day;
}

// 현재 날짜 문자열 가져오기 (YYYY-MM-DD 형식)
export function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
}