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
      throw new Error(`메시지 전송에 실패했습니다: ${response.statusText}. 상태 코드: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('메시지 전송 중 오류 발생:', error);
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
      throw new Error(`파일 정보 가져오기에 실패했습니다: ${response.statusText}. 상태 코드: ${response.status}, 파일 ID: ${fileId}`);
    }
    
    const data = await response.json();
    
    if (!data.ok || !data.result.file_path) {
      throw new Error(`텔레그램 API에서 파일 경로를 가져오지 못했습니다. 응답: ${JSON.stringify(data)}, 파일 ID: ${fileId}`);
    }
    
    const filePath = data.result.file_path;
    return `${TELEGRAM_FILE_API}/${filePath}`;
  } catch (error) {
    console.error('파일 URL 가져오기 중 오류 발생:', error);
    throw error;
  }
}