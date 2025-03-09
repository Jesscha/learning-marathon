import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { 
  getTodayKoreanString,
  formatDateToKorean
} from '../../utils/dateUtils';
import { getStreakData } from '../../utils/firebaseUtils';
import { sendMessage } from '../../utils/telegramUtils';

export class StreakStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('채팅 ID가 누락되었습니다. 텔레그램 계정 정보를 확인해주세요.');
    
    try {
      // 스트릭 데이터 가져오기
      const streakData = await getStreakData();
      
      if (!streakData) {
        await sendMessage(chatId, '스트릭 데이터를 찾을 수 없습니다. 관리자에게 문의해주세요.');
        return;
      }
      
      // 스트릭 정보 메시지 생성
      const message = this.createStreakMessage(streakData);
      
      // 메시지 전송
      await sendMessage(chatId, message);
      
    } catch (error) {
      console.error('스트릭 상태 조회 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`스트릭 상태 조회 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 스트릭 정보 메시지 생성
   * @param streakData 스트릭 데이터
   * @returns 포맷팅된 메시지
   */
  private createStreakMessage(streakData: any): string {
    const { streak, updatedAt } = streakData;
    
    // 업데이트 날짜 포맷팅
    let updatedDateStr = '알 수 없음';
    if (updatedAt) {
      // Firestore 타임스탬프를 Date 객체로 변환
      const updatedDate = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
      updatedDateStr = formatDateToKorean(updatedDate);
    }
    
    // 오늘 날짜
    const todayKorean = getTodayKoreanString();
    
    // 스트릭 이모지 선택
    let streakEmoji = '🔥';
    if (streak >= 30) streakEmoji = '🌟';
    else if (streak >= 20) streakEmoji = '💫';
    else if (streak >= 10) streakEmoji = '✨';
    
    // 메시지 제목
    const messageTitle = `${streakEmoji} 러닝마라톤 스트릭 현황 ${streakEmoji}`;
    const disclaimer = '월, 수, 금요일에만 streak을 계산합니다.';
    
    // 메시지 본문
    let messageBody = '';
    messageBody += `\n현재 스트릭: ${streak}일`;
    messageBody += `\n마지막 업데이트: ${updatedDateStr}`;
    messageBody += `\n오늘 날짜: ${todayKorean}`;
    messageBody += `\n${disclaimer}`;
    // 스트릭 상태에 따른 추가 메시지
    if (streak === 0) {
      messageBody += `\n\n😢 아쉽게도 스트릭이 초기화되었습니다. 다시 시작해봐요!`;
    } else if (streak >= 30) {
      messageBody += `\n\n🎉 대단해요! ${streak}일 연속 달성 중입니다!`;
    } else if (streak >= 10) {
      messageBody += `\n\n👏 잘하고 있어요! ${streak}일 연속 달성 중입니다!`;
    } else {
      messageBody += `\n\n💪 화이팅! ${streak}일 연속 달성 중입니다!`;
    }
    
    // 최종 메시지 조합
    return `${messageTitle}\n${messageBody}`;
  }

  getDescription(): string {
    return '그룹의 체크인 스트릭 상태를 보여줍니다.';
  }

  getUsage(): string {
    return '/streak';
  }
}

// 전략 등록
commandContext.registerStrategy('streak', new StreakStrategy()); 