import { TelegramUpdate } from '../types/TelegramUpdate';
import { commandContext } from './CommandContext';

// 모든 전략 가져오기 (자동 등록)
import './strategies/CheckinStrategy';
import './strategies/TodayStrategy';
import './strategies/StatusStrategy';
import './strategies/HelpStrategy';

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
      const executed = await commandContext.executeStrategy(commandName, update, args);
      if (!executed) {
        console.log(`Unknown command: ${commandName}`);
        // TODO: 알 수 없는 명령어 응답 처리
      }
    } catch (error) {
      console.error(`Error processing command ${commandName}:`, error);
      // TODO: 오류 응답 처리
    }
  }
}
