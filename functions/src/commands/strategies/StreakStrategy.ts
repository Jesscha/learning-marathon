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
   * 일관성에 관한 영감을 주는 명언 중 랜덤 선택
   * @param streak 스트릭 값
   * @returns 랜덤 명언
   */
  private createCheeringMessage(streak: number): string {
    // 스트릭이 0인 경우 특별 메시지
    if (streak === 0) {
      return '😢 아쉽게도 스트릭이 초기화되었습니다. 다시 시작해봐요!';
    }
    
    // 일관성에 관한 영감을 주는 명언 목록
    const inspiringQuotes = [
      `"We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle`,
      
      `"It's not what we do once in a while that shapes our lives, but what we do consistently." - Tony Robbins`,
      
      `"Small disciplines repeated with consistency every day lead to great achievements gained slowly over time." - John C. Maxwell`,
      
      `"Consistency before intensity. Start small and become the kind of person who shows up every day. Build a new identity. Then increase the intensity." - James Clear`,
      
      `"Success is the result of consistent action, fueled by passion and guided by purpose."`,
      
      `"Long-term consistency trumps short-term intensity." - Bruce Lee`
    ];
    
    // 0부터 4까지의 랜덤 인덱스 생성
    const randomIndex = Math.floor(Math.random() * inspiringQuotes.length);
    
    return inspiringQuotes[randomIndex];
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
    const streakEmoji = streak > 0 ? '🏃‍♂️' : '🌟';
    
    // 메시지 제목
    const messageTitle = `${streakEmoji} 러닝마라톤 스트릭 현황 ${streakEmoji}`;
    
    // 메시지 본문
    let messageBody = '';
    messageBody += `\n현재 스트릭: ${streak}일`;
    messageBody += `\n마지막 업데이트: ${updatedDateStr}`;
    messageBody += `\n오늘 날짜: ${todayKorean}`;
    
    // 응원 메시지 추가
    messageBody += `\n\n${this.createCheeringMessage(streak)}`;
    
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