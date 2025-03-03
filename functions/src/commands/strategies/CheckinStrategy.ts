import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { isPhotoMessage, isTextMessage } from '../../types/TelegramUpdate';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { telegramConfig } from '../../config/telegramConfig';

const TELEGRAM_API = telegramConfig.apiUrl;
const TELEGRAM_FILE_API = telegramConfig.fileApiUrl;

export class CheckinStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    const userId = update.message?.from?.id;
    const message = update.message;
    if (!chatId || !userId || !message) return;
    
    // 사진 메시지인 경우
    if (isPhotoMessage(message) && message.photo && message.photo.length > 0) {
      const photoInfo = message.photo[message.photo.length - 1]; // 가장 큰 해상도의 사진 선택
      const caption = message.caption || '';
      const content = args.join(' ') || caption || '';
      
      console.log(`User ${userId} checked in with photo (${photoInfo.file_id}) and caption: ${content}`);
      
      try {
        // 1. 텔레그램 API를 통해 파일 정보 가져오기
        const fileUrl = await this.getFileUrl(photoInfo.file_id);
        
        // 2. 파일 다운로드 및 Firebase Storage에 업로드
        const downloadUrl = await this.downloadAndUploadFile(fileUrl, userId, chatId);
        
        // 3. 체크인 데이터 Firestore에 저장
        await this.saveCheckinToFirestore(userId, chatId, content, downloadUrl);
        
        // 4. 체크인 성공 메시지 보내기
        await this.sendSuccessMessage(chatId, '사진 체크인이 성공적으로 등록되었습니다!');
      } catch (error) {
        console.error('Error processing photo check-in:', error);
        await this.sendErrorMessage(chatId, '사진 체크인 처리 중 오류가 발생했습니다.');
      }
    } 
    // 텍스트 메시지인 경우
    else if (isTextMessage(message) && message.text) {
      const content = args.join(' ') || '';
      
      console.log(`User ${userId} checked in with text: ${content}`);
      
      try {
        // 체크인 데이터 Firestore에 저장
        await this.saveCheckinToFirestore(userId, chatId, content);
        
        // 체크인 성공 메시지 보내기
        await this.sendSuccessMessage(chatId, '텍스트 체크인이 성공적으로 등록되었습니다!');
      } catch (error) {
        console.error('Error processing text check-in:', error);
        await this.sendErrorMessage(chatId, '텍스트 체크인 처리 중 오류가 발생했습니다.');
      }
    }
  }

  // 텔레그램 API를 통해 파일 URL 가져오기
  private async getFileUrl(fileId: string): Promise<string> {
    try {
      // getFile API 호출
      const response = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get file path from Telegram API: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.ok || !data.result.file_path) {
        throw new Error('Failed to get file path from Telegram API');
      }
      
      const filePath = data.result.file_path;
      return `${TELEGRAM_FILE_API}/${filePath}`;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error('파일 URL을 가져오는 중 오류가 발생했습니다.');
    }
  }

  // 파일 다운로드 및 Firebase Storage에 업로드
  private async downloadAndUploadFile(fileUrl: string, userId: number, chatId: number): Promise<string> {
    const tempFilePath = path.join(os.tmpdir(), `photo_${userId}_${Date.now()}.jpg`);
    
    try {
      // 파일 다운로드
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      // 응답을 버퍼로 변환
      const buffer = await response.arrayBuffer();
      
      // 임시 파일로 저장
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));
      
      // Firebase Storage에 업로드
      const bucket = admin.storage().bucket();
      const timestamp = Date.now();
      const storageFilePath = `checkins/${chatId}/${userId}/${timestamp}.jpg`;
      
      await bucket.upload(tempFilePath, {
        destination: storageFilePath,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId: userId.toString(),
            chatId: chatId.toString(),
            timestamp: timestamp.toString()
          }
        }
      });
      
      // 임시 파일 삭제
      fs.unlinkSync(tempFilePath);
      
      // 다운로드 URL 생성
      const file = bucket.file(storageFilePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2100' // 장기간 유효한 URL
      });
      
      return url;
    } catch (error) {
      console.error('Error downloading and uploading file:', error);
      // 임시 파일이 존재하면 삭제
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw new Error('파일 다운로드 및 업로드 중 오류가 발생했습니다.');
    }
  }

  // 체크인 데이터 Firestore에 저장
  private async saveCheckinToFirestore(userId: number, chatId: number, content: string, photoUrl?: string): Promise<void> {
    try {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const checkinData: any = {
        userId,
        chatId,
        content,
        timestamp,
        type: photoUrl ? 'photo' : 'text'
      };
      
      if (photoUrl) {
        checkinData.photoUrl = photoUrl;
      }
      
      // Firestore에 저장
      await admin.firestore()
        .collection('checkins')
        .add(checkinData);
      
      // 사용자의 체크인 상태 업데이트
      await admin.firestore()
        .collection('users')
        .doc(userId.toString())
        .set({
          lastCheckin: timestamp,
          chatId
        }, { merge: true });
      
    } catch (error) {
      console.error('Error saving check-in to Firestore:', error);
      throw new Error('체크인 데이터 저장 중 오류가 발생했습니다.');
    }
  }

  // 성공 메시지 보내기
  private async sendSuccessMessage(chatId: number, message: string): Promise<void> {
    try {
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send success message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending success message:', error);
    }
  }

  // 오류 메시지 보내기
  private async sendErrorMessage(chatId: number, message: string): Promise<void> {
    try {
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send error message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  getDescription(): string {
    return '오늘의 체크인을 등록합니다.';
  }

  getUsage(): string {
    return '/checkin [메시지]';
  }
}

// 전략 등록
commandContext.registerStrategy('checkin', new CheckinStrategy()); 