import { TelegramUpdate } from '../types/TelegramUpdate';
import { CommandContext, commandContext } from './CommandContext';

// 모든 전략 가져오기 (자동 등록)
import './strategies/CheckinStrategy';
import './strategies/TodayStrategy';
import './strategies/StatusStrategy';
import './strategies/HelpStrategy';

// 명령어 처리 함수
export async function processCommand(update: TelegramUpdate) {
  if (!update.message) return;
  const chatId = update.message.chat?.id;
  const userId = update.message.from?.id;
  if (!chatId || !userId) return;

  // 명령어 실행
  try {
    const commandName = CommandContext.parseCommand(update);
    await commandContext.executeStrategy(commandName, update, []);
  } catch (error) {
    console.error(`Error processing command`, error);
  }
}
