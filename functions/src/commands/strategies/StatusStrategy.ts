import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';

export class StatusStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) return;
    
    // TODO: 그룹 스트릭 계산 로직 구현
    console.log('Processing /status command');
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