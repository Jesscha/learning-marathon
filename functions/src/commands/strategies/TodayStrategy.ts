import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { sendMessage } from '../../utils/telegramUtils';
import { User } from '../../types/User';
import { 
  getTodayDateString, 
  getTodayKoreanString 
} from '../../utils/dateUtils';
import { fetchTodayCheckins, fetchAllUsers } from '../../utils/firebaseUtils';

export class TodayStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('채팅 ID가 누락되었습니다. 텔레그램 계정 정보를 확인해주세요.');
    
    try {
      // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
      const today = getTodayDateString();
      console.log(`오늘 날짜(KST): ${today}`);
      
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
        await sendMessage(chatId, '등록된 사용자가 없습니다.');
        return;
      }
      
      // 체크인 상태 메시지 생성 및 전송
      const message = this.createCheckinStatusMessage(users, checkedInUserIds);
      await sendMessage(chatId, message);
      
    } catch (error) {
      console.error('체크인 상태 조회 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`체크인 상태 조회 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 체크인 상태 메시지 생성
   * @param users 모든 사용자 목록
   * @param checkedInUserIds 체크인한 사용자 ID 집합
   * @returns 포맷팅된 메시지
   */
  private createCheckinStatusMessage(users: User[], checkedInUserIds: Set<string>): string {
    const koreanDate = getTodayKoreanString();
    const messageTitle = `🏃‍♂️ 러닝마라톤 - ${koreanDate}`;
    let messageBody = '';
    
    // 모든 사용자의 체크인 상태 표시
    users.forEach(user => {
      const checkStatus = checkedInUserIds.has(user.userId) ? '✅' : '☑️';
      messageBody += `- ${user.userFirstName} ${checkStatus}\n`;
    });
    
    // 체크인 통계
    const totalUsers = users.length;  
    const checkedInCount = checkedInUserIds.size;
    
    messageBody += `\n총 ${totalUsers}명 중 ${checkedInCount}명 체크인 완료`;
    
    // 최종 메시지 조합
    return `${messageTitle}\n\n${messageBody}`;
  }

  getDescription(): string {
    return '오늘의 체크인 현황을 보여줍니다.';
  }

  getUsage(): string {
    return '/today';
  }
}

// 전략 등록
commandContext.registerStrategy('today', new TodayStrategy()); 