import { telegramConfig } from '../config/telegramConfig';

// 텔레그램 API URL
const TELEGRAM_API = telegramConfig.apiUrl;
const TELEGRAM_FILE_API = telegramConfig.fileApiUrl;

/**
 * 텔레그램 채팅방에 텍스트 메시지 보내기
 * @param chatId 채팅방 ID
 * @param text 보낼 메시지 텍스트
 * @param parseMode 메시지 파싱 모드 (Markdown 또는 HTML)
 * @returns 텔레그램 API 응답
 */
export async function sendMessage(
  chatId: number, 
  text: string, 
  parseMode?: 'Markdown' | 'HTML'
): Promise<any> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * 텔레그램 파일 정보 가져오기
 * @param fileId 텔레그램 파일 ID
 * @returns 파일 다운로드 URL
 */
export async function getFileUrl(fileId: string): Promise<string> {
  try {
    const response = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.ok || !data.result.file_path) {
      throw new Error('Failed to get file path from Telegram API');
    }
    
    const filePath = data.result.file_path;
    return `${TELEGRAM_FILE_API}/${filePath}`;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}