import { TelegramUpdate } from '../types/TelegramUpdate';
import { CommandStrategy } from './strategies/CommandStrategy';

// 명령어 컨텍스트 (Context)
export class CommandContext {
  private strategies: Map<string, CommandStrategy> = new Map();

  // 전략 등록
  registerStrategy(commandName: string, strategy: CommandStrategy): void {
    this.strategies.set(commandName.toLowerCase(), strategy);
  }

  // 전략 실행
  async executeStrategy(commandName: string, update: TelegramUpdate, args: string[]): Promise<boolean> {
    const strategy = this.strategies.get(commandName.toLowerCase());
    if (strategy) {
      await strategy.execute(update, args);
      return true;
    }
    return false;
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
}

// 싱글톤 인스턴스 생성
export const commandContext = new CommandContext(); 