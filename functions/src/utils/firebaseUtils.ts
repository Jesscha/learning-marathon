import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CheckIn } from '../types/CheckIn';
import { User } from '../types/User';
import { storageBucket } from '../firebase';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getTodayDateString } from './dateUtils';
import { db } from '../firebase';
import { logger } from 'firebase-functions';
import { StreakData } from '../types/StreakData';

/**
 * 사용자 정보를 Firestore에 저장
 * @param userId 사용자 ID
 * @param userFirstName 사용자 이름
 * @param userLastName 사용자 성
 * @param chatId 채팅 ID
 * @returns 신규 사용자 여부 (true: 신규, false: 기존)
 */
export async function saveUserToFirestore(
  userId: number,
  userFirstName: string,
  userLastName: string,
  chatId: number
): Promise<boolean> {
  try {
    // 사용자 컬렉션 참조
    const usersCollection = admin.firestore().collection('users');

    // 사용자 ID로 문서 조회
    const userDoc = await usersCollection.doc(userId.toString()).get();

    // 이미 존재하는 사용자인 경우
    if (userDoc.exists) {
      console.log(`사용자 ${userId} (${userFirstName} ${userLastName})는 이미 등록되어 있습니다.`);
      return false;
    }

    // 신규 사용자 데이터 생성
    const userData: User = {
      userId: userId.toString(),
      telegramChatId: chatId,
      userFirstName,
      userLastName,
      mission: ''
    };

    // Firestore에 사용자 데이터 저장
    await usersCollection.doc(userId.toString()).set(userData);

    console.log(`신규 사용자 ${userId} (${userFirstName} ${userLastName})가 등록되었습니다.`);
    return true;
  } catch (error) {
    console.error('사용자 정보 저장 중 오류 발생:', error);
    // 사용자 정보 저장 실패는 체크인 프로세스를 중단시키지 않음
    return false;
  }
}

/**
 * 체크인 데이터 Firestore에 저장
 * @param userId 사용자 ID
 * @param userFirstName 사용자 이름
 * @param userLastName 사용자 성
 * @param chatId 채팅 ID
 * @param content 체크인 내용
 * @param photoUrl 사진 URL (선택 사항)
 */
export async function saveCheckinToFirestore(
  userId: number,
  userFirstName: string,
  userLastName: string,
  chatId: number,
  content: string,
  photoUrl?: string
): Promise<void> {
  try {
    // 현재 날짜 정보 가져오기
    const now = new Date();
    const dateId = getTodayDateString(); // YYYY-MM-DD 형식의 ID 생성
    const timestamp = Timestamp.fromDate(now);

    // 체크인 데이터 객체 생성 (CheckIn 인터페이스에 맞게)
    const checkinData: CheckIn = {
      userId: userId.toString(),
      userFirstName,
      userLastName,
      chatId: chatId.toString(),
      content,
      timestamp: timestamp,
      photoUrl: photoUrl || ''
    };

    // 1. Day 문서 참조 가져오기 (없으면 생성)
    const dayRef = admin.firestore().collection('days').doc(dateId);

    // 2. Day 문서가 존재하는지 확인
    const dayDoc = await dayRef.get();

    // 3. Day 문서가 없으면 생성
    if (!dayDoc.exists) {
      await dayRef.set({
        id: dateId,
        timestamp: admin.firestore.Timestamp.fromDate(now),
        createdAt: timestamp
      });
    }

    // 4. Day 문서의 하위 컬렉션으로 체크인 저장
    await dayRef.collection('checkins').add(checkinData);

  } catch (error) {
    console.error('체크인 데이터 저장 중 오류 발생:', error);
    throw new Error('체크인 데이터 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 오늘의 체크인 데이터 조회
 * @param dateId 날짜 ID (YYYY-MM-DD 형식)
 * @returns 체크인 데이터 배열
 */
export async function fetchTodayCheckins(dateId: string): Promise<CheckIn[]> {
  // Firestore에서 오늘 날짜의 체크인 데이터 조회
  const dayRef = admin.firestore().collection('days').doc(dateId);
  const dayDoc = await dayRef.get();

  if (!dayDoc.exists) {
    return [];
  }

  // 체크인 데이터 가져오기
  const checkinsSnapshot = await dayRef.collection('checkins').get();

  if (checkinsSnapshot.empty) {
    return [];
  }

  // 체크인 데이터 정리
  const checkins: CheckIn[] = [];
  checkinsSnapshot.forEach(doc => {
    checkins.push(doc.data() as CheckIn);
  });

  return checkins;
}

/**
 * 파일 다운로드 및 Firebase Storage에 업로드
 * @param fileUrl 파일 URL
 * @param userId 사용자 ID
 * @param chatId 채팅 ID
 * @returns 업로드된 파일의 공개 URL
 */
export async function downloadAndUploadFile(fileUrl: string, userId: number, chatId: number): Promise<string> {
  const tempFilePath = path.join(os.tmpdir(), `photo_${userId}_${Date.now()}.jpg`);

  try {
    // 파일 다운로드
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`파일 다운로드에 실패했습니다: ${response.statusText}. 상태 코드: ${response.status}, URL: ${fileUrl}`);
    }

    // 응답을 버퍼로 변환
    const buffer = await response.arrayBuffer();

    // 임시 파일로 저장
    fs.writeFileSync(tempFilePath, Buffer.from(buffer));

    // Firebase Storage에 업로드
    const bucket = storageBucket;
    const timestamp = Date.now();
    const storageFilePath = `checkins/${chatId}/${userId}/${timestamp}.jpg`;

    await bucket.upload(tempFilePath, {
      destination: storageFilePath,
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          userId: userId.toString(),
          chatId: chatId.toString(),
          timestamp: timestamp.toString()
        }
      }
    });

    // 임시 파일 삭제
    fs.unlinkSync(tempFilePath);

    // 공개 URL 생성 (서명된 URL 대신)
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFilePath}`;

    return publicUrl;
  } catch (error) {
    console.error('파일 다운로드 및 업로드 중 오류 발생:', error);
    // 임시 파일이 존재하면 삭제
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw new Error(`파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}. 파일 URL: ${fileUrl}`);
  }
}

/**
 * 어제의 체크인 데이터 가져오기
 * @param date 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns 체크인 데이터 배열
 */
export async function fetchYesterdayCheckins(date: string): Promise<CheckIn[]> {
  try {
    logger.info(`체크인 데이터 조회 시작: days/${date}/checkins`);
    
    // 컬렉션 경로 확인
    const collectionPath = `days/${date}/checkins`;
    logger.info(`체크인 컬렉션 경로: ${collectionPath}`);
    
    // 체크인 데이터 가져오기
    const snapshot = await db.collection(collectionPath).get();
    
    logger.info(`체크인 데이터 조회 결과: ${snapshot.size}개 문서 발견`);
    
    if (snapshot.empty) {
      logger.warn(`${date} 날짜에 체크인 데이터가 없습니다.`);
      return [];
    }
    // 체크인 데이터 변환
    const checkins: CheckIn[] = snapshot.docs.map(doc => {
      const data = doc.data();
      logger.debug(`체크인 문서 데이터:`, data);
      
      return {
        userId: data.userId,
        userFirstName: data.userFirstName,
        userLastName: data.userLastName,
        chatId: data.chatId,
        content: data.content,
        timestamp: data.timestamp,
        photoUrl: data.photoUrl
      };
    });

    return checkins;
  } catch (error) {
    logger.error(`체크인 데이터 조회 중 오류 발생:`, error);
    throw new Error(`체크인 데이터 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 모든 사용자 정보 가져오기
 * @returns 사용자 정보 배열
 */
export async function fetchAllUsers(): Promise<User[]> {
  try {
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      logger.warn('등록된 사용자가 없습니다.');
      return [];
    }
    const users: User[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        userFirstName: data.userFirstName,
        userLastName: data.userLastName || '',
        telegramChatId: data.telegramChatId,
        mission: data.mission || ''
      };
    });
    return users;
  } catch (error) {
    logger.error('사용자 정보 조회 중 오류 발생:', error);
    throw new Error(`사용자 정보 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 스트릭 데이터 가져오기
 * @returns 스트릭 데이터
 */
export async function getStreakData(): Promise<StreakData | null> {
  try {
    // 'streaks' 컬렉션에서 'streakData' 문서 가져오기
    const doc = await db.collection('streaks').doc('streakData').get();
    
    if (!doc.exists) {
      logger.warn('스트릭 데이터가 없습니다.');
      return null;
    }
    
    return doc.data() as StreakData;
  } catch (error) {
    logger.error('스트릭 데이터 조회 중 오류 발생:', error);
    throw new Error(`스트릭 데이터 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 스트릭 업데이트
 * @param current 현재 스트릭
 * @param longest 최장 스트릭
 * @param previous 이전 스트릭 (선택 사항)
 */
export async function updateStreak(current: number, longest: number, previous?: number) {
  try {
    // 'streaks' 컬렉션에 'streakData' 문서 업데이트
    const streakUpdate: any = {
      streak: {
        current,
        longest
      },
      updatedAt: Date.now()
    };
    if (previous !== undefined) {
      streakUpdate.streak.previous = previous;
    }
    await db.collection('streaks').doc('streakData').set(streakUpdate);
    
    logger.info(`스트릭 업데이트 완료: current=${current}, longest=${longest}, previous=${previous}`);
  } catch (error) {
    logger.error('스트릭 업데이트 중 오류 발생:', error);
    throw new Error(`스트릭 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}