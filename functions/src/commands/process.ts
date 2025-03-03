import { TelegramUpdate } from '../types/TelegramUpdate';
import { CommandContext, commandContext } from './CommandContext';

// 모든 전략 가져오기 (자동 등록)
import './strategies/CheckinStrategy';
import './strategies/TodayStrategy';
import './strategies/StatusStrategy';

export async function processCommand(update: TelegramUpdate) {
  if (!update.message) throw new Error('메시지가 비어 있습니다. 유효한 메시지를 보내주세요.');
  const chatId = update.message.chat?.id;
  const userId = update.message.from?.id;
  if (!chatId || !userId) throw new Error('채팅 ID 또는 사용자 ID가 누락되었습니다. 텔레그램 계정 정보를 확인해주세요.');

  // 명령어 실행 - 오류를 상위로 전파
  const commandName = CommandContext.parseCommand(update);
  await commandContext.executeStrategy(commandName, update, []);
}
