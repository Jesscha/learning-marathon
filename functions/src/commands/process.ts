import { TelegramUpdate } from '../types/TelegramUpdate';
import { CommandContext, commandContext } from './CommandContext';

// 모든 전략 가져오기 (자동 등록)
import './strategies/CheckinStrategy';
import './strategies/TodayStrategy';
import './strategies/StatusStrategy';

export async function processCommand(update: TelegramUpdate) {
  if (!update.message) throw new Error('Message is empty');
  const chatId = update.message.chat?.id;
  const userId = update.message.from?.id;
  if (!chatId || !userId) throw new Error('Chat ID or User ID is missing');

  // 명령어 실행 - 오류를 상위로 전파
  const commandName = CommandContext.parseCommand(update);
  await commandContext.executeStrategy(commandName, update, []);
}
