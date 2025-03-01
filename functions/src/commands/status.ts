import { TelegramUpdate } from "../types/TelegramUpdate";
import { Command } from "../types/Command";
import { CommandHandler, registerCommand } from "./registerCommand";

const statusHandler: CommandHandler = {
    execute: async (update: TelegramUpdate, args: string[]) => {
      const chatId = update.message?.chat?.id;
      const userId = update.message?.from?.id;
      if (!chatId || !userId) return;

      // TODO: 스트릭 계산 로직 구현
      console.log(`User ${userId} checked streak`);
    }
  };

registerCommand(Command.STATUS, statusHandler);