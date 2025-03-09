import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { sendMessage } from '../utils/telegramUtils';
import { 
  getTodayDateString, 
  getTodayKoreanString,
  getWorkingDayInfo
} from '../utils/dateUtils';
import { fetchTodayCheckins, fetchAllUsers } from '../utils/firebaseUtils';
import { User } from '../types/User';

// 그룹 채팅 ID 설정 (실제 그룹 채팅 ID로 변경 필요)
const GROUP_CHAT_ID: number = -4602634156; // 러닝맨 그룹챗 ID

/**
 * 체크인 상태 메시지 생성
 * @param users 모든 사용자 목록
 * @param checkedInUserIds 체크인한 사용자 ID 집합
 * @param isLastReminder 마지막 알림인지 여부 (11시 알림)
 * @param dayName 요일 이름
 * @returns 포맷팅된 메시지
 */
const createCheckinStatusMessage = (
  users: User[], 
  checkedInUserIds: Set<string>,
  isLastReminder: boolean,
  dayName: string
): string => {
  const koreanDate = getTodayKoreanString();
  const messageTitle = isLastReminder 
    ? `🔔 마지막 알림: 러닝마라톤 - ${koreanDate} (${dayName})`
    : `🔔 알림: 러닝마라톤 - ${koreanDate} (${dayName})`;
  
  let messageBody = '';
  
  // 모든 사용자의 체크인 상태 표시
  users.forEach(user => {
    const checkStatus = checkedInUserIds.has(user.userId) ? '✅' : '☑️';
    messageBody += `- ${user.userFirstName} ${checkStatus}\n`;
  });
  
  // 체크인 통계
  const totalUsers = users.length;  
  const checkedInCount = checkedInUserIds.size;
  const remainingCount = totalUsers - checkedInCount;
  
  if (remainingCount === 0) {
    messageBody += `\n🎉 전원 체크인 완료!`;
  } else {
    messageBody += `\n총 ${totalUsers}명 중 ${checkedInCount}명 체크인 완료`;
    messageBody += `\n아직 ${remainingCount}명이 체크인하지 않았습니다!`;
    
    if (isLastReminder) {
      messageBody += `\n\n⚠️ 오늘 체크인 마감 시간이 얼마 남지 않았습니다. 서둘러주세요!`;
    }
  }
  
  // 최종 메시지 조합
  return `${messageTitle}\n\n${messageBody}`;
};

/**
 * 체크인 상태 확인 및 알림 메시지 전송
 * @param isLastReminder 마지막 알림인지 여부 (11시 알림)
 */
const sendReminderMessage = async (isLastReminder: boolean): Promise<void> => {
  try {
    // 오늘이 근무일인지 확인
    const { isWorking, dayName } = getWorkingDayInfo();
    
    // 근무일이 아닌 경우 알림을 보내지 않음
    if (!isWorking) {
      logger.info(`오늘은 ${dayName}로 근무일이 아닙니다. 알림을 보내지 않습니다.`);
      return;
    }
    
    logger.info(`오늘은 ${dayName}로 근무일입니다. 알림을 보냅니다.`);
    
    // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
    const today = getTodayDateString();
    logger.info(`오늘 날짜(KST): ${today}, ${isLastReminder ? '마지막 알림' : '첫 알림'}`);
    
    // 모든 사용자 정보 가져오기
    const users = await fetchAllUsers();
    
    // 오늘의 체크인 데이터 조회
    const checkins = await fetchTodayCheckins(today);
    
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
    
    // 체크인 상태 메시지 생성 및 전송
    const message = createCheckinStatusMessage(users, checkedInUserIds, isLastReminder, dayName);
    await sendMessage(GROUP_CHAT_ID, message);
    logger.info(`체크인 알림 메시지 전송 완료: ${isLastReminder ? '마지막 알림' : '첫 알림'}`);
    
  } catch (error) {
    logger.error('체크인 알림 전송 중 오류 발생:', error);
  }
};

// 매일 저녁 8시(KST)에 실행되는 함수
export const eveningReminder = onSchedule({
  schedule: '0 20 * * *',
  timeZone: 'Asia/Seoul'
}, async (event) => {
  logger.info('저녁 8시 알림 시작');
  await sendReminderMessage(false);
  logger.info('저녁 8시 알림 완료');
});

// 매일 저녁 11시(KST)에 실행되는 함수
export const nightReminder = onSchedule({
  schedule: '0 23 * * *',
  timeZone: 'Asia/Seoul'
}, async (event) => {
  logger.info('저녁 11시 알림 시작');
  await sendReminderMessage(true);
  logger.info('저녁 11시 알림 완료');
});