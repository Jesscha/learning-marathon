import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getDateDebugInfo } from '../utils/dateUtils';
import {
  checkIfYesterdayWasWorkingDay,
  getYesterdayCheckins,
  getStreak,
  increaseStreak,
  resetStreak,
  recoverStreakIfPossible,
  expireRecoveryOpportunity
} from '../services/streakService';

/**
 * 스트릭 업데이트 확인 및 처리
 * @returns 처리 결과 메시지
 */
export const checkAndUpdateStreak = async (): Promise<string> => {
  try {
    // 날짜 디버깅 정보 로깅
    const dateDebugInfo = getDateDebugInfo();
    logger.info('날짜 디버깅 정보:', dateDebugInfo);
    
    // 먼저 복구 가능 여부 체크
    const recoveryResult = await recoverStreakIfPossible();
    if (recoveryResult) {
      logger.info('스트릭 복구 성공:', recoveryResult);
      return recoveryResult;
    }
    
    // 복구 기회 만료 체크
    const expiryResult = await expireRecoveryOpportunity();
    if (expiryResult) {
      logger.info('복구 기회 만료:', expiryResult);
      return expiryResult;
    }
    
    // 어제가 근무일인지 확인
    const { isWorkingDay, dayName, message: workingDayMessage } = await checkIfYesterdayWasWorkingDay();
    if (!isWorkingDay) {
      return workingDayMessage;
    }
    
    // 어제의 체크인 데이터 가져오기
    const { users, checkedInUserIds, message: checkinsMessage } = await getYesterdayCheckins();
    if (checkinsMessage) {
      return checkinsMessage;
    }
    
    // 스트릭 데이터 가져오기
    const { streakData, message: streakMessage } = await getStreak();
    if (streakMessage) {
      return streakMessage;
    }
    
    const currentStreak = streakData.streak.current;
    const longestStreak = streakData.streak.longest;
    
    // 모든 사용자가 체크인했는지 확인 (사용자 ID 기반)
    const allUserIds = new Set(users.map(user => user.userId));
    logger.info(`등록된 고유 사용자 ID 수: ${allUserIds.size}`);
    
    // 체크인한 사용자 ID 로깅
    logger.info(`체크인한 사용자 ID 목록: ${Array.from(checkedInUserIds).join(', ')}`);
    
    // 모든 사용자가 체크인했는지 확인
    let allCheckedIn = true;
    const notCheckedInUserIds = [];
    
    for (const userId of allUserIds) {
      if (!checkedInUserIds.has(userId)) {
        allCheckedIn = false;
        notCheckedInUserIds.push(userId);
      }
    }
    
    if (notCheckedInUserIds.length > 0) {
      logger.info(`체크인하지 않은 사용자 ID: ${notCheckedInUserIds.join(', ')}`);
    }
    
    if (allCheckedIn) {
      // 모든 사용자가 체크인한 경우 스트릭 증가
      return await increaseStreak(currentStreak, longestStreak);
    } else {
      // 일부 사용자가 체크인하지 않은 경우 스트릭 초기화
      return await resetStreak(users, checkedInUserIds, currentStreak, longestStreak, dayName);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logger.error('스트릭 체크 중 오류 발생:', error);
    return `스트릭 체크 중 오류 발생: ${errorMessage}`;
  }
};

// 매일 자정 1분 후(KST)에 실행되는 함수
export const streakCheckOnMidnight = onSchedule({
  schedule: '1 15 * * *',  // 15:01 UTC = 00:01 KST
  timeZone: 'UTC'
}, async (event) => {
  logger.info('자정 이후 스트릭 체크 시작');
  const result = await checkAndUpdateStreak();
  logger.info('자정 이후 스트릭 체크 완료:', result);
});

// HTTP 요청으로 스트릭 체크를 수동으로 트리거하는 함수
export const manualStreakCheck = onRequest({
  cors: true,
  maxInstances: 1
}, async (req, res) => {
  try {
    logger.info('수동 스트릭 체크 요청 수신');
    
    // 디버그 모드 확인
    const debug = req.query.debug === 'true';
    if (debug) {
      logger.info('디버그 모드로 실행됩니다.');
    }
    
    // 스트릭 체크 실행
    const result = await checkAndUpdateStreak();
    
    // 결과 반환
    res.status(200).json({
      success: true,
      message: result,
      timestamp: new Date().toISOString(),
      dateInfo: getDateDebugInfo()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logger.error('수동 스트릭 체크 중 오류 발생:', error);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});
