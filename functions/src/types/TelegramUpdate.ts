
// Define TypeScript interfaces for Telegram updates
export interface TelegramUpdate {
    update_id: number;
    message?: {
      message_id: number;
      from?: {
        id: number;
        first_name?: string;
      };
      chat?: {
        id: number;
      };
      text?: string;
    };
  }
  