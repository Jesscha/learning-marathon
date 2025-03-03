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
    throw new Error(`알 수 없는 명령어입니다: ${commandName}. '/help'를 입력하여 사용 가능한 명령어를 확인하세요.`);
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
    if (!payload.message) throw new Error('메시지가 비어 있습니다. 유효한 메시지를 보내주세요.');

    if (isTextMessage(payload.message)) {
      const text = payload.message.text;
      if (!text) throw new Error('텍스트 메시지가 비어 있습니다. 내용을 입력해주세요.');
      
      // 명령어가 /로 시작하는지 확인
      if (!text.startsWith('/')) {
        throw new Error('텍스트 메시지가 "/"로 시작하지 않습니다. 명령어는 "/"로 시작해야 합니다. (예: /checkin)');
      }
      
      // /를 제거하고 첫 번째 단어를 명령어로 사용
      const parts = text.substring(1).split(' ');
      const commandName = parts[0].toLowerCase();
      return commandName;
    }
    
    if (isPhotoMessage(payload.message)) {
      const caption = payload.message.caption;
      
      // 캡션이 없는 경우 기본 명령어 반환 또는 오류 발생
      if (!caption || caption.trim() === '') {
        throw new Error('사진 캡션이 비어 있습니다. 사진과 함께 "/명령어" 형식의 캡션을 입력해주세요. (예: /checkin)');
      }
      
      // 명령어가 /로 시작하는지 확인
      if (!caption.startsWith('/')) {
        throw new Error('사진 캡션이 "/"로 시작하지 않습니다. 명령어는 "/"로 시작해야 합니다. (예: /checkin)');
      }
      
      // /를 제거하고 첫 번째 단어를 명령어로 사용
      const parts = caption.substring(1).split(' ');
      const commandName = parts[0].toLowerCase();
      return commandName;
    }
    
    throw new Error('지원되지 않는 메시지 유형입니다. 텍스트 메시지나 사진 메시지를 보내주세요.');
  }
}

// 싱글톤 인스턴스 생성
export const commandContext = new CommandContext(); 