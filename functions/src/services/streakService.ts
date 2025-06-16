import { logger } from 'firebase-functions';
import { 
  fetchYesterdayCheckins, 
  fetchAllUsers, 
  updateStreak, 
  getStreakData, 
  fetchTodayCheckins 
} from '../utils/firebaseUtils';
import { 
  getKoreanYesterday, 
  getYesterdayDateString, 
  getWorkingDayInfo 
} from '../utils/dateUtils';
import { sendMessage } from '../utils/telegramUtils';
import { createStreakResetMessage, createStreakIncreaseMessage } from '../utils/messageUtils';
import { User } from '../types/User';
import { StreakData } from '../types/StreakData';

// 그룹 채팅 ID 설정
const GROUP_CHAT_ID: number = -4602634156; // 러닝맨 그룹챗 ID

/**
 * 어제가 근무인지 확인
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
  
  // 어제가 근무인지 확인
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
 */
export async function getYesterdayCheckins(): Promise<{users: User[], checkedInUserIds: Set<string>, message: string | null}> {
  // 어제 날짜 가져오기 (YYYY-MM-DD 형식)
  const yesterdayDate = getYesterdayDateString();
  logger.info(`어제 날짜 문자열(KST): ${yesterdayDate}`);
  
  // 모든 사용자 정보 가져오기
  const users = await fetchAllUsers();
  logger.info(`등록된 사용자 수: ${users.length}`);
  
  // 사용자가 없는 경우
  if (users.length === 0) {
    const message = '등록된 사용자가 없습니다.';
    logger.info(message);
    return { users, checkedInUserIds: new Set<string>(), message };
  }
  
  // 어제의 체크인 데이터 조회
  const checkins = await fetchYesterdayCheckins(yesterdayDate);
  logger.info(`어제의 체크인 문서 수: ${checkins.length}`);
  
  // 체크인한 사용자 ID 목록 생성 (중복 제거)
  const checkedInUserIds = new Set<string>();
  checkins.forEach(checkin => {
    checkedInUserIds.add(checkin.userId);
  });
  
  logger.info(`중복 제거 후 체크인한 사용자 수: ${checkedInUserIds.size}`);
  
  // 체크인하지 않은 사용자 로깅
  const notCheckedInUsers = users.filter(user => !checkedInUserIds.has(user.userId));
  if (notCheckedInUsers.length > 0) {
    logger.info(`체크인하지 않은 사용자: ${notCheckedInUsers.map(u => u.userFirstName).join(', ')}`);
  }
  
  return { users, checkedInUserIds, message: null };
}

/**
 * 스트릭 데이터 가져오기
 */
export async function getStreak(): Promise<{streakData: StreakData, message: string | null}> {
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
  users: User[], 
  checkedInUserIds: Set<string>, 
  currentStreak: number, 
  longestStreak: number,
  dayName: string
): Promise<string> {
  // streak이 끊길 때 previous에 currentStreak 저장
  await updateStreak(0, longestStreak, currentStreak);
  
  const logMessage = `일부 사용자가 체크인하지 않았습니다. 스트릭이 ${currentStreak}에서 0으로 초기화되었습니다.`;
  logger.info(logMessage);
  
  // 스트릭 초기화 메시지 전송
  const message = createStreakResetMessage(users, checkedInUserIds, currentStreak, dayName);
  await sendMessage(GROUP_CHAT_ID, message);
  logger.info('스트릭 초기화 메시지 전송 완료');
  
  return logMessage;
}

/**
 * 오늘이 streak 복구일(recovery day)인지 판단
 * @returns {Promise<boolean>} 복구일 여부
 */
export async function isRecoveryDay(): Promise<boolean> {
  const streakData = await getStreakData();
  if (!streakData || !streakData.streak.previous || streakData.streak.current !== 0) {
    return false;
  }
  // streak이 끊긴 다음날인지 확인 (updatedAt이 어제 날짜)
  const updatedAt: Date = streakData.updatedAt.toDate();
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    updatedAt.getFullYear() === yesterday.getFullYear() &&
    updatedAt.getMonth() === yesterday.getMonth() &&
    updatedAt.getDate() === yesterday.getDate();
  if (!isYesterday) return false;
  
  // 오늘이 화/목/토인지 확인 (스트릭이 끊긴 다음날)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  const isRecoveryDayOfWeek = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6; // 화(2), 목(4), 토(6)
  
  return isRecoveryDayOfWeek;
}

/**
 * 오늘 모두 체크인 시 previous로 streak 복구
 * @returns {Promise<string|null>} 복구 성공 메시지 또는 null
 */
export async function recoverStreakIfPossible(): Promise<string|null> {
  // 복구일이 아니면 아무것도 하지 않음
  if (!(await isRecoveryDay())) return null;

  // 오늘 날짜(YYYY-MM-DD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 모든 사용자 정보
  const users = await fetchAllUsers();
  if (users.length === 0) return null;

  // 오늘 체크인 데이터
  const checkins = await fetchTodayCheckins(todayStr);
  const checkedInUserIds = new Set(checkins.map(c => c.userId));
  const allCheckedIn = users.every(u => checkedInUserIds.has(u.userId));

  if (!allCheckedIn) return null;

  // streakData 불러오기
  const streakData = await getStreakData();
  if (!streakData || !streakData.streak.previous) return null;

  // previous로 복구하고 +1 추가 (복구도 스트릭 성공으로 간주)
  const previous: number = streakData.streak.previous;
  
  // previous 값이 유효한 숫자인지 확인
  if (typeof previous !== 'number' || previous < 0 || !Number.isInteger(previous)) {
    logger.error(`Invalid previous streak value: ${previous}`);
    return null;
  }
  
  const recoveredStreak = previous + 1;
  const longest = Math.max(recoveredStreak, streakData.streak.longest);
  await updateStreak(recoveredStreak, longest, undefined); // 복구 후 previous는 undefined로

  // 알림 메시지 전송
  const message = `streak이 ${recoveredStreak}일로 다시 복구되었습니다.`;
  await sendMessage(GROUP_CHAT_ID, message);
  return message;
}

/**
 * 복구 기회 만료 처리 (복구일이 지났는데 복구하지 못한 경우)
 * @returns {Promise<string|null>} 만료 처리 메시지 또는 null
 */
export async function expireRecoveryOpportunity(): Promise<string|null> {
  const streakData = await getStreakData();
  if (!streakData || !streakData.streak.previous || streakData.streak.current !== 0) {
    return null; // 만료할 복구 기회가 없음
  }
  
  // 복구일이 아닌 경우에만 만료 처리
  if (await isRecoveryDay()) {
    return null; // 아직 복구일이므로 만료하지 않음
  }
  
  // previous 값 제거하여 복구 기회 완전 만료
  await updateStreak(0, streakData.streak.longest, undefined);
  
  const message = `복구 기회가 만료되었습니다. 스트릭은 0으로 유지됩니다.`;
  logger.info(message);
  return message;
} 