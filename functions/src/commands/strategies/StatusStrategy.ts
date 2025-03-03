import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';

export class StatusStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('Chat ID is missing');
    
    // TODO: 그룹 스트릭 계산 로직 구현
    console.log('Processing /status command');
    
    // 오류가 발생하면 상위로 전파
    // 예: throw new Error('스트릭 계산 중 오류가 발생했습니다');
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