import { TelegramUpdate } from '../../types/TelegramUpdate';

// 명령어 전략 인터페이스 (Strategy)
export interface CommandStrategy {
  execute: (update: TelegramUpdate, args: string[]) => Promise<void>;
  getDescription: () => string;
  getUsage: () => string;
} 