import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';

export class CheckinStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    const userId = update.message?.from?.id;
    if (!chatId || !userId) return;
    
    const content = args[0] || '';
    // TODO: 체크인 로직 구현
    console.log(`User ${userId} checked in with content: ${content}`);
  }

  getDescription(): string {
    return '오늘의 체크인을 등록합니다.';
  }

  getUsage(): string {
    return '/checkin [메시지]';
  }
}

// 전략 등록
commandContext.registerStrategy('checkin', new CheckinStrategy()); 