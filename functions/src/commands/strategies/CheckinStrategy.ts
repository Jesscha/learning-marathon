import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { isPhotoMessage, isTextMessage } from '../../types/TelegramUpdate';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { sendMessage, getFileUrl } from '../../utils/telegramUtils';
import { CheckIn } from '../../types/CheckIn';
import { Timestamp } from 'firebase-admin/firestore';
import { storageBucket } from '../../firebase';

export class CheckinStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    const userId = update.message?.from?.id;
    const userFirstName = update.message?.from?.first_name || '';
    const userLastName = update.message?.from?.last_name || '';
    const message = update.message;
    
    if (!chatId || !userId || !message) {
      throw new Error('메시지 정보가 불완전합니다. 채팅 ID, 사용자 ID 또는 메시지가 누락되었습니다.');
    }
    
    // 사진 메시지인 경우
    if (isPhotoMessage(message) && message.photo && message.photo.length > 0) {
      const photoInfo = message.photo[message.photo.length - 1]; // 가장 큰 해상도의 사진 선택
      const caption = message.caption || '';
      const content = args.join(' ') || caption || '';
      
      console.log(`사용자 ${userId} (${userFirstName} ${userLastName})가 사진(${photoInfo.file_id})과 캡션으로 체크인했습니다: ${content}`);
      
      try {
        // 1. 텔레그램 API를 통해 파일 정보 가져오기
        const fileUrl = await getFileUrl(photoInfo.file_id);
        
        // 2. 파일 다운로드 및 Firebase Storage에 업로드
        const downloadUrl = await this.downloadAndUploadFile(fileUrl, userId, chatId);
        
        // 3. 체크인 데이터 Firestore에 저장
        await this.saveCheckinToFirestore(
          userId, 
          userFirstName,
          userLastName,
          chatId, 
          content, 
          downloadUrl
        );
        
        // 4. 체크인 성공 메시지 보내기
        await sendMessage(chatId, '사진 체크인이 성공적으로 등록되었습니다! 👍');
      } catch (error) {
        console.error('사진 체크인 처리 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        await sendMessage(chatId, `사진 체크인 처리 중 오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
      }
    }
    // 텍스트 메시지인 경우
    else if (isTextMessage(message) && message.text) {
      const content = args.join(' ') || '';
      
      console.log(`사용자 ${userId} (${userFirstName} ${userLastName})가 텍스트로 체크인했습니다: ${content}`);
      
      try {
        // 체크인 데이터 Firestore에 저장
        await this.saveCheckinToFirestore(
          userId,
          userFirstName,
          userLastName,
          chatId,
          content
        );
        
        // 체크인 성공 메시지 보내기
        await sendMessage(chatId, '텍스트 체크인이 성공적으로 등록되었습니다! 👍');
      } catch (error) {
        console.error('텍스트 체크인 처리 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        await sendMessage(chatId, `텍스트 체크인 처리 중 오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
      }
    }
  }

  // 파일 다운로드 및 Firebase Storage에 업로드
  private async downloadAndUploadFile(fileUrl: string, userId: number, chatId: number): Promise<string> {
    const tempFilePath = path.join(os.tmpdir(), `photo_${userId}_${Date.now()}.jpg`);
    
    try {
      // 파일 다운로드
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`파일 다운로드에 실패했습니다: ${response.statusText}. 상태 코드: ${response.status}, URL: ${fileUrl}`);
      }
      
      // 응답을 버퍼로 변환
      const buffer = await response.arrayBuffer();
      
      // 임시 파일로 저장
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));
      
      // Firebase Storage에 업로드
      const bucket = storageBucket;
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
      console.error('파일 다운로드 및 업로드 중 오류 발생:', error);
      // 임시 파일이 존재하면 삭제
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw new Error(`파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}. 파일 URL: ${fileUrl}`);
    }
  }

  // 체크인 데이터 Firestore에 저장
  private async saveCheckinToFirestore(
    userId: number, 
    userFirstName: string,
    userLastName: string,
    chatId: number, 
    content: string, 
    photoUrl?: string
  ): Promise<void> {
    try {
      // 현재 날짜 정보 가져오기
      const now = new Date();
      const dateId = this.formatDateToYYYYMMDD(now); // YYYY-MM-DD 형식의 ID 생성
      const timestamp = Timestamp.fromDate(now);
      
      // 체크인 데이터 객체 생성 (CheckIn 인터페이스에 맞게)
      const checkinData: CheckIn = {
        userId: userId.toString(),
        userFirstName,
        userLastName,
        chatId: chatId.toString(),
        content,
        timestamp: timestamp,
        photoUrl: photoUrl || ''
      };
      
      if (photoUrl) {
        checkinData.photoUrl = photoUrl;
      }
      
      // 1. Day 문서 참조 가져오기 (없으면 생성)
      const dayRef = admin.firestore().collection('days').doc(dateId);
      
      // 2. Day 문서가 존재하는지 확인
      const dayDoc = await dayRef.get();
      
      // 3. Day 문서가 없으면 생성
      if (!dayDoc.exists) {
        await dayRef.set({
          id: dateId,
          timestamp: admin.firestore.Timestamp.fromDate(now),
          createdAt: timestamp
        });
      }
      
      // 4. Day 문서의 하위 컬렉션으로 체크인 저장
      await dayRef.collection('checkins').add(checkinData);
      
    } catch (error) {
      console.error('Error saving check-in to Firestore:', error);
      throw new Error('체크인 데이터 저장 중 오류가 발생했습니다.');
    }
  }
  
  // YYYY-MM-DD 형식으로 날짜 포맷팅
  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDescription(): string {
    return '오늘의 학습 내용을 체크인합니다. 텍스트나 사진과 함께 사용할 수 있습니다.';
  }

  getUsage(): string {
    return '/checkin [내용] 또는 사진과 함께 /checkin [내용]';
  }
}

// 전략 등록
commandContext.registerStrategy('checkin', new CheckinStrategy()); 