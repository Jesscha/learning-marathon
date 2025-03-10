import { isPhotoMessage, isTextMessage, TelegramUpdate } from '../types/TelegramUpdate';
import { CommandStrategy } from './strategies/CommandStrategy';

// 명령어 컨텍스트 (Context)
export class CommandContext {
  private strategies: Map<string, CommandStrategy> = new Map();

  // 전략 등록
  registerStrategy(commandName: string, strategy: CommandStrategy): void {
    this.strategies.set(commandName.toLowerCase(), strategy);
  }

  async executeStrategy(commandName: string, update: TelegramUpdate, args: string[]): Promise<void> {
    const strategy = this.strategies.get(commandName.toLowerCase());
    if (strategy) {
      // 전략 실행 중 발생하는 모든 오류를 상위로 전파
      await strategy.execute(update, args);
      return;
    }
    // 알 수 없는 명령어 오류를 상위로 전파
    throw new Error(`${commandName}은 없는 명령어입니다.`);
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
  static parseCommand(payload: TelegramUpdate): string | null {
    if (!payload.message) return null;

    if (isTextMessage(payload.message)) {
      const text = payload.message.text;
      if (!text) return null;
      
      // 명령어가 /로 시작하는지 확인
      if (!text.startsWith('/')) {
        return null; // 명령어가 아닌 경우 null 반환
      }
      
      // /를 제거하고 첫 번째 단어를 명령어로 사용
      const parts = text.substring(1).split(' ');
      const commandName = parts[0].toLowerCase();
      return commandName;
    }
    
    if (isPhotoMessage(payload.message)) {
      const caption = payload.message.caption;
      
      // 캡션이 없는 경우 null 반환
      if (!caption || caption.trim() === '') {
        return null;
      }
      
      // 명령어가 /로 시작하는지 확인
      if (!caption.startsWith('/')) {
        return null; // 명령어가 아닌 경우 null 반환
      }
      
      // /를 제거하고 첫 번째 단어를 명령어로 사용
      const parts = caption.substring(1).split(' ');
      const commandName = parts[0].toLowerCase();
      return commandName;
    }
    
    return null; // 지원되지 않는 메시지 유형인 경우 null 반환
  }
}

// 싱글톤 인스턴스 생성
export const commandContext = new CommandContext(); 