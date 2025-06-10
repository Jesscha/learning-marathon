import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { getStreakData } from '../../utils/firebaseUtils';
import { sendMessage } from '../../utils/telegramUtils';
import { isRecoveryDay } from '../../services/streakService';

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
      
      // 오늘이 복구일인지 확인
      const isRecovery = await isRecoveryDay();
      
      // 스트릭 정보 메시지 생성
      const message = this.createStreakMessage(streakData, isRecovery);
      
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
   * @param isRecovery 복구일 여부
   * @returns 포맷팅된 메시지
   */
  private createStreakMessage(streakData: any, isRecovery: boolean): string {
    const { streak } = streakData;

    // 메시지 제목
    const messageTitle = `러닝마라톤 스트릭 현황 🏃‍♂️`;
    const disclaimer = '- 스트릭은 매주 월,수,금요일에만 계산됩니다.'
    
    // 메시지 본문
    let messageBody = '';
    
    // 복구일인 경우 우선적으로 안내
    if (isRecovery) {
      messageBody += `\n🔄 오늘은 스트릭을 복구할 수 있는 날입니다.\n`;
    }
    
    messageBody += `\n🔥 현재 스트릭: ${streak.current}일 🔥`;
    
    // 복구 관련 정보 추가
    if (isRecovery && streak.previous) {
      messageBody += `\n⚡️ 복구 가능한 스트릭: ${streak.previous}일`;
    }
    
    // 응원 메시지 추가
    messageBody += `\n\n${this.createCheeringMessage(streak.current)}`;
    
    // 최종 메시지 조합
    return `${messageTitle}\n${disclaimer}\n${messageBody}`;
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