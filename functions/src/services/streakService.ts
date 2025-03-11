import { logger } from 'firebase-functions';
import { 
  fetchYesterdayCheckins, 
  fetchAllUsers, 
  updateStreak, 
  getStreakData 
} from '../utils/firebaseUtils';
import { 
  getKoreanYesterday, 
  getYesterdayDateString, 
  getWorkingDayInfo 
} from '../utils/dateUtils';
import { sendMessage } from '../utils/telegramUtils';
import { createStreakResetMessage, createStreakIncreaseMessage } from '../utils/messageUtils';

// 그룹 채팅 ID 설정
const GROUP_CHAT_ID: number = -4602634156; // 러닝맨 그룹챗 ID

/**
 * 어제가 근무일인지 확인
 * @returns {Promise<{isWorkingDay: boolean, dayName: string, message: string}>}
 */
export async function checkIfYesterdayWasWorkingDay(): Promise<{
  isWorkingDay: boolean;
  dayName: string;
  message: string;
}> {
  // 한국 시간 기준으로 어제 날짜 가져오기
  const yesterday = getKoreanYesterday();
  const { isWorking, dayName } = getWorkingDayInfo(yesterday);
  
  // 어제가 근무일인지 확인
  logger.info(`어제 날짜(KST): ${yesterday.toISOString()}, 요일: ${dayName}`);
  
  if (!isWorking) {
    const message = `어제는 ${dayName}로 근무일이 아니었습니다. 스트릭 체크를 하지 않습니다.`;
    logger.info(message);
    return { isWorkingDay: false, dayName, message };
  }
  
  logger.info(`어제는 ${dayName}로 근무일이었습니다. 스트릭 체크를 진행합니다.`);
  return { 
    isWorkingDay: true, 
    dayName, 
    message: `어제는 ${dayName}로 근무일이었습니다.` 
  };
}

/**
 * 어제의 체크인 데이터 가져오기
 * @returns {Promise<{users: User[], checkedInUserIds: Set<string>, message: string | null}>}
 */
export async function getYesterdayCheckins() {
  // 어제 날짜 가져오기 (YYYY-MM-DD 형식)
  const yesterdayDate = getYesterdayDateString();
  logger.info(`어제 날짜 문자열(KST): ${yesterdayDate}`);
  
  // 모든 사용자 정보 가져오기
  const users = await fetchAllUsers();
  
  // 사용자가 없는 경우
  if (users.length === 0) {
    const message = '등록된 사용자가 없습니다.';
    logger.info(message);
    return { users, checkedInUserIds: new Set<string>(), message };
  }
  
  // 어제의 체크인 데이터 조회
  const checkins = await fetchYesterdayCheckins(yesterdayDate);
  
  // 체크인한 사용자 ID 목록 생성
  const checkedInUserIds = new Set<string>();
  checkins.forEach(checkin => {
    checkedInUserIds.add(checkin.userId);
  });
  
  return { users, checkedInUserIds, message: null };
}

/**
 * 스트릭 데이터 가져오기
 * @returns {Promise<{streakData: any, message: string | null}>}
 */
export async function getStreak() {
  // 현재 메타데이터 가져오기
  const streakData = await getStreakData();
  if (!streakData) {
    const message = '스트릭 데이터가 없습니다.';
    logger.info(message);
    throw new Error(message);
  }
  
  return { streakData, message: null };
}

/**
 * 스트릭 증가 처리
 * @param currentStreak 현재 스트릭
 * @param longestStreak 최장 스트릭
 * @returns {Promise<string>} 처리 결과 메시지
 */
export async function increaseStreak(currentStreak: number, longestStreak: number): Promise<string> {
  const newCurrentStreak = currentStreak + 1;
  const newLongestStreak = newCurrentStreak > longestStreak ? newCurrentStreak : longestStreak;
  
  await updateStreak(newCurrentStreak, newLongestStreak);
  
  const message = `모든 사용자가 체크인했습니다. 스트릭이 ${currentStreak}에서 ${newCurrentStreak}로 증가했습니다.`;
  logger.info(message);
  
  // 스트릭 증가 메시지 전송 (선택적)
  const notificationMessage = createStreakIncreaseMessage(currentStreak, newCurrentStreak);
  await sendMessage(GROUP_CHAT_ID, notificationMessage);
  
  return message;
}

/**
 * 스트릭 초기화 처리
 * @param users 모든 사용자 목록
 * @param checkedInUserIds 체크인한 사용자 ID 집합
 * @param currentStreak 현재 스트릭
 * @param longestStreak 최장 스트릭
 * @param dayName 요일 이름
 * @returns {Promise<string>} 처리 결과 메시지
 */
export async function resetStreak(
  users: any[], 
  checkedInUserIds: Set<string>, 
  currentStreak: number, 
  longestStreak: number,
  dayName: string
): Promise<string> {
  await updateStreak(0, longestStreak);
  
  const logMessage = `일부 사용자가 체크인하지 않았습니다. 스트릭이 ${currentStreak}에서 0으로 초기화되었습니다.`;
  logger.info(logMessage);
  
  // 스트릭 초기화 메시지 전송
  const message = createStreakResetMessage(users, checkedInUserIds, currentStreak, dayName);
  await sendMessage(GROUP_CHAT_ID, message);
  logger.info('스트릭 초기화 메시지 전송 완료');
  
  return logMessage;
} 