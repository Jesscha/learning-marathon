import { TelegramUpdate } from '../types/TelegramUpdate';
import { CommandContext, commandContext } from './CommandContext';

// 모든 전략 가져오기 (자동 등록)
import './strategies/CheckinStrategy';
import './strategies/TodayStrategy';
import './strategies/StatusStrategy';

export async function processCommand(update: TelegramUpdate) {
  if (!update.message) return; // 메시지가 없으면 아무 작업도 수행하지 않음
  
  const chatId = update.message.chat?.id;
  const userId = update.message.from?.id;
  
  if (!chatId || !userId) return; // 필수 정보가 없으면 아무 작업도 수행하지 않음

  // 명령어 파싱
  const commandName = CommandContext.parseCommand(update);
  
  // 명령어가 아닌 경우 아무 작업도 수행하지 않음
  if (commandName === null) return;
  
  // 명령어 실행 - 오류를 상위로 전파
  await commandContext.executeStrategy(commandName, update, []);
}
