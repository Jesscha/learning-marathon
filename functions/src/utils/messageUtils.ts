import { User } from '../types/User';
import { getTodayKoreanString } from './dateUtils';

/**
 * 스트릭 초기화 메시지 생성
 * @param users 모든 사용자 목록
 * @param checkedInUserIds 체크인한 사용자 ID 집합
 * @param previousStreak 이전 스트릭 값
 * @param dayName 요일 이름
 * @returns 포맷팅된 메시지
 */
export const createStreakResetMessage = (
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
 * 스트릭 증가 메시지 생성
 * @param previousStreak 이전 스트릭 값
 * @param newStreak 새 스트릭 값
 * @returns 포맷팅된 메시지
 */
export const createStreakIncreaseMessage = (
  previousStreak: number,
  newStreak: number
): string => {
  const koreanDate = getTodayKoreanString();
  return `🎉 스트릭 증가: ${koreanDate}\n\n모든 사용자가 체크인했습니다!\n이전 스트릭: ${previousStreak}일 → 현재 스트릭: ${newStreak}일`;
}; 