// Define TypeScript interfaces for Telegram updates
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// 공통 메시지 속성을 가진 기본 인터페이스
export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name?: string;
    last_name?: string;
    is_bot?: boolean;
    language_code?: string;
  };
  chat?: {
    id: number;
    first_name?: string;
    last_name?: string;
    type?: string;
  };
  date?: number;
}

// 텍스트 메시지 인터페이스
export interface TelegramTextMessage extends TelegramMessage {
  text?: string;
}

// 사진 메시지 인터페이스
export interface TelegramPhotoMessage extends TelegramMessage {
  photo?: Array<{
    file_id: string;
  }>;
  caption?: string;
}

// 메시지 타입 가드 함수
export function isTextMessage(message: TelegramMessage): message is TelegramTextMessage {
  return 'text' in message;
}

export function isPhotoMessage(message: TelegramMessage): message is TelegramPhotoMessage {
  return 'photo' in message;
}