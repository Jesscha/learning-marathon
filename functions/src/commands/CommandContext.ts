import { isPhotoMessage, isTextMessage, TelegramUpdate } from '../types/TelegramUpdate';
import { CommandStrategy } from './strategies/CommandStrategy';

// 명령어 컨텍스트 (Context)
export class CommandContext {
  private strategies: Map<string, CommandStrategy> = new Map();

  // 전략 등록
  registerStrategy(commandName: string, strategy: CommandStrategy): void {
    this.strategies.set(commandName.toLowerCase(), strategy);
  }

  // 전략 실행
  async executeStrategy(commandName: string, update: TelegramUpdate, args: string[]): Promise<void> {
    const strategy = this.strategies.get(commandName.toLowerCase());
    if (strategy) {
      await strategy.execute(update, args);
      return;
    }
    throw new Error(`Unknown command: ${commandName}`);
  }

  // 사용 가능한 모든 명령어 목록 반환
  getAvailableCommands(): Map<string, { description: string, usage: string }> {
    const commands = new Map();
    this.strategies.forEach((strategy, name) => {
      commands.set(name, {
        description: strategy.getDescription(),
        usage: strategy.getUsage()
      });
    });
    return commands;
  }

  // factory method for parse payload from telegram to create strategy
  static parseCommand(payload: TelegramUpdate): string {
    if (!payload.message) throw new Error('Message is empty');

    if (isTextMessage(payload.message)) {
        const text = payload.message.text;
        if (!text) throw new Error('Text message is empty');
        const parts = text.substring(1).split(' ');
        const commandName = parts[0].toLowerCase();
        return commandName;
    }
    if (isPhotoMessage(payload.message)) {
        const caption = payload.message.caption;
        if (!caption) throw new Error('Caption is empty');
        const parts = caption.split(' ');
        const commandName = parts[0].toLowerCase();
        return commandName;
    }
    throw new Error('Invalid message type');
  }
}

// 싱글톤 인스턴스 생성
export const commandContext = new CommandContext(); 