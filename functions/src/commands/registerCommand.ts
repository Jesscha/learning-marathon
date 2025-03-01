import { Command } from '../types/Command';
import { TelegramUpdate } from '../types/TelegramUpdate';

// 명령어 핸들러 인터페이스
export interface CommandHandler {
  execute: (update: TelegramUpdate, args: string[]) => Promise<void>;
}

// 명령어 레지스트리
export const commandRegistry: Record<string, CommandHandler> = {};

// 새 명령어 등록 함수
export function registerCommand(command: Command | string, handler: CommandHandler): void {
  commandRegistry[command] = handler;
}

// 명령어 실행 함수
export async function executeCommand(commandName: string, update: TelegramUpdate, args: string[]): Promise<boolean> {
  if (commandRegistry[commandName]) {
    await commandRegistry[commandName].execute(update, args);
    return true;
  }
  return false;
}