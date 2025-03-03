import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { getTodayDateString, getTodayKoreanString } from '../../utils/dateUtils';

export class StatusStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('채팅 ID가 누락되었습니다. 텔레그램 계정 정보를 확인해주세요.');
    
    // TODO: 그룹 스트릭 계산 로직 구현
    console.log('"/status" 명령어 처리 중');
    console.log(`오늘 날짜(KST): ${getTodayDateString()}`);
    console.log(`한국어 날짜: ${getTodayKoreanString()}`);
    
    // 오류가 발생하면 상위로 전파
    // 예: throw new Error('스트릭 계산 중 오류가 발생했습니다: 데이터베이스 연결 실패');
  }

  getDescription(): string {
    return '그룹의 체크인 스트릭 상태를 보여줍니다.';
  }

  getUsage(): string {
    return '/status';
  }
}

// 전략 등록
commandContext.registerStrategy('status', new StatusStrategy()); 