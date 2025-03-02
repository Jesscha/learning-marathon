import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';

export class TodayStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) return;
    
    // TODO: 오늘의 체크인 상태 조회 로직 구현
    console.log('Processing /today command');
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