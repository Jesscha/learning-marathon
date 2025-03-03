import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';

export class TodayStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('Chat ID is missing');
    
    // TODO: 오늘의 체크인 상태 조회 로직 구현
    console.log('Processing /today command');
    
    // 오류가 발생하면 상위로 전파
    // 예: throw new Error('체크인 상태 조회 중 오류가 발생했습니다');
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