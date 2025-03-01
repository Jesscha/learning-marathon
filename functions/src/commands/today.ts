import { TelegramUpdate } from "../types/TelegramUpdate";
import { CommandHandler, registerCommand } from "./registerCommand";
import { Command } from "../types/Command";
const todayHandler: CommandHandler = {
    execute: async (update: TelegramUpdate, args: string[]) => {
      const chatId = update.message?.chat?.id;
      const userId = update.message?.from?.id;
      if (!chatId || !userId) return;

      // TODO: 오늘의 체크인 상태 조회 로직 구현
      console.log(`User ${userId} checked today's checkin`);
    }
  };

registerCommand(Command.TODAY, todayHandler);