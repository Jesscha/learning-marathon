import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { sendMessage } from '../utils/telegramUtils';
import {  
  getTodayKoreanString,
  getWorkingDayInfo,
  getYesterdayDateString
} from '../utils/dateUtils';
import { 
  fetchYesterdayCheckins, 
  fetchAllUsers, 
  updateStreak, 
  getStreakData 
} from '../utils/firebaseUtils';
import { User } from '../types/User';

// 그룹 채팅 ID 설정 (실제 그룹 채팅 ID로 변경 필요)
const GROUP_CHAT_ID: number = -4602634156; // 러닝맨 그룹챗 ID

/**
 * 스트릭 초기화 메시지 생성
 * @param users 모든 사용자 목록
 * @param checkedInUserIds 체크인한 사용자 ID 집합
 * @param previousStreak 이전 스트릭 값
 * @param dayName 요일 이름
 * @returns 포맷팅된 메시지
 */
const createStreakResetMessage = (
  users: User[], 
  checkedInUserIds: Set<string>,
  previousStreak: number,
  dayName: string
): string => {
  const koreanDate = getTodayKoreanString();
  const messageTitle = `⚠️ 스트릭 초기화: 러닝마라톤 - ${koreanDate} (${dayName})`;
  
  let messageBody = '';
  
  // 모든 사용자의 체크인 상태 표시
  users.forEach(user => {
    const checkStatus = checkedInUserIds.has(user.userId) ? '✅' : '❌';
    messageBody += `- ${user.userFirstName} ${checkStatus}\n`;
  });
  
  // 체크인 통계
  const totalUsers = users.length;  
  const checkedInCount = checkedInUserIds.size;
  const notCheckedInCount = totalUsers - checkedInCount;
  
  messageBody += `\n총 ${totalUsers}명 중 ${checkedInCount}명만 체크인했습니다.`;
  messageBody += `\n${notCheckedInCount}명이 체크인하지 않아 스트릭이 초기화되었습니다.`;
  messageBody += `\n\n이전 스트릭: ${previousStreak}일 → 현재 스트릭: 0일`;
  messageBody += `\n\n⚠️ 모임통장의 돈은 혐오단체에 기부됩니다.`;
  
  // 최종 메시지 조합
  return `${messageTitle}\n\n${messageBody}`;
};

/**
 * 스트릭 업데이트 확인 및 처리
 */
const checkAndUpdateStreak = async (): Promise<void> => {
  try {
    // 어제가 근무일인지 확인
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { isWorking, dayName } = getWorkingDayInfo(yesterday);
    
    // 어제가 근무일이 아닌 경우 스트릭 체크를 하지 않음
    if (!isWorking) {
      logger.info(`어제는 ${dayName}로 근무일이 아니었습니다. 스트릭 체크를 하지 않습니다.`);
      return;
    }
    
    logger.info(`어제는 ${dayName}로 근무일이었습니다. 스트릭 체크를 진행합니다.`);
    
    // 어제 날짜 가져오기 (YYYY-MM-DD 형식)
    const yesterdayDate = getYesterdayDateString();
    logger.info(`어제 날짜(KST): ${yesterdayDate}`);
    
    // 모든 사용자 정보 가져오기
    const users = await fetchAllUsers();
    
    // 어제의 체크인 데이터 조회
    const checkins = await fetchYesterdayCheckins(yesterdayDate);
    
    // 체크인한 사용자 ID 목록 생성
    const checkedInUserIds = new Set<string>();
    checkins.forEach(checkin => {
      checkedInUserIds.add(checkin.userId);
    });
    
    // 사용자가 없는 경우
    if (users.length === 0) {
      logger.info('등록된 사용자가 없습니다.');
      return;
    }
    
    // 현재 메타데이터 가져오기
    const streakData = await getStreakData();
    if (!streakData) {
      logger.info('스트릭 데이터가 없습니다.');
      return;
    }

    const currentStreak = streakData.streak.current;
    
    // 모든 사용자가 체크인했는지 확인
    const allCheckedIn = checkedInUserIds.size === users.length;
    
    if (allCheckedIn) {
      // 모든 사용자가 체크인한 경우 스트릭 증가
      const newCurrentStreak = currentStreak + 1;
      const newLongestStreak = newCurrentStreak > streakData.streak.longest ? newCurrentStreak : streakData.streak.longest;
      await updateStreak(newCurrentStreak, newLongestStreak);
      logger.info(`모든 사용자가 체크인했습니다. 스트릭이 ${currentStreak}에서 ${newCurrentStreak}로 증가했습니다.`);
    } else {
      // 일부 사용자가 체크인하지 않은 경우 스트릭 초기화
      await updateStreak(0, streakData.streak.longest);
      logger.info(`일부 사용자가 체크인하지 않았습니다. 스트릭이 ${currentStreak}에서 0으로 초기화되었습니다.`);
      
      // 스트릭 초기화 메시지 전송
      const message = createStreakResetMessage(users, checkedInUserIds, currentStreak, dayName);
      await sendMessage(GROUP_CHAT_ID, message);
      logger.info('스트릭 초기화 메시지 전송 완료');
    }
    
  } catch (error) {
    logger.error('스트릭 체크 중 오류 발생:', error);
  }
};

// 매일 자정 1분 후(KST)에 실행되는 함수
export const streakChecker = onSchedule({
  schedule: '1 0 * * *',  // 00:01 AM (0시 1분)
  timeZone: 'Asia/Seoul'
}, async (event) => {
  logger.info('자정 이후 스트릭 체크 시작');
  await checkAndUpdateStreak();
  logger.info('자정 이후 스트릭 체크 완료');
});

