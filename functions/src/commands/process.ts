import { TelegramUpdate } from '../types/TelegramUpdate';
import { Command } from '../types/Command';
import { commandRegistry } from './commandRegistry';

// 명령어 처리 함수
export async function processCommand(update: TelegramUpdate) {
  if (!update.message || !update.message.text) return;

  const text = update.message.text;
  const chatId = update.message.chat?.id;
  const userId = update.message.from?.id;
  if (!chatId || !userId) return;

  // 명령어 파싱
  if (text.startsWith('/')) {
    const parts = text.substring(1).split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 명령어 실행
    try {
      // Command enum에 있는 명령어인지 확인
      if (Object.values(Command).includes(commandName as Command)) {
        const command = commandName as Command;
        await commandRegistry[command].execute(update, args);
      } else {
        console.log(`Unknown command: ${commandName}`);
        // TODO: 알 수 없는 명령어 응답 처리
      }
    } catch (error) {
      console.error(`Error processing command ${commandName}:`, error);
      // TODO: 오류 응답 처리
    }
  }
}
