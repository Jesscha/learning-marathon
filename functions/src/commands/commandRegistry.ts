import { Command } from "../types/Command";
import { TelegramUpdate } from "../types/TelegramUpdate";

// 명령어 핸들러 인터페이스 정의
interface CommandHandler {
    execute: (update: TelegramUpdate, args: string[]) => Promise<void>;
}

// 명령어 레지스트리 - 새 명령어를 쉽게 추가할 수 있는 구조
export const commandRegistry: Record<Command, CommandHandler> = {
    [Command.CHECKIN]: {
        execute: async (update: TelegramUpdate, args: string[]) => {
            const chatId = update.message?.chat?.id;
            const userId = update.message?.from?.id;
            if (!chatId || !userId) return;

            const content = args[0] || '';
            // TODO: 체크인 로직 구현
            console.log(`User ${userId} checked in with content: ${content}`);
        }
    },

    [Command.TODAY]: {
        execute: async (update: TelegramUpdate, args: string[]) => {
            const chatId = update.message?.chat?.id;
            if (!chatId) return;

            // TODO: 오늘의 체크인 상태 조회 로직 구현
            console.log('Processing /today command');
        }
    },

    [Command.STATUS]: {
        execute: async (update: TelegramUpdate, args: string[]) => {
            const chatId = update.message?.chat?.id;
            if (!chatId) return;

            // TODO: 그룹 스트릭 계산 로직 구현
            console.log('Processing /status command');
        }
    }
};