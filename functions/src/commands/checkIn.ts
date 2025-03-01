import { TelegramUpdate } from "../types/TelegramUpdate";
import { CommandHandler, registerCommand } from './registerCommand';
import { Command } from '../types/Command';

const checkinHandler: CommandHandler = {
  execute: async (update: TelegramUpdate, args: string[]) => {
    const chatId = update.message?.chat?.id;
    const userId = update.message?.from?.id;
    if (!chatId || !userId) return;
    
    const content = args[0] || '';
    // TODO: 체크인 로직 구현
    console.log(`User ${userId} checked in with content: ${content}`);
  }
};

// 명령어 등록
registerCommand(Command.CHECKIN, checkinHandler);