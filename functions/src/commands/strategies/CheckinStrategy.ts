import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import { isPhotoMessage, isTextMessage } from '../../types/TelegramUpdate';
import { sendMessage, getFileUrl } from '../../utils/telegramUtils';
import { 
  saveUserToFirestore, 
  saveCheckinToFirestore, 
  downloadAndUploadFile 
} from '../../utils/firebaseUtils';

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
    
    try {
      // 사용자 정보 저장 (신규 사용자인 경우에만)
      const isNewUser = await saveUserToFirestore(userId, userFirstName, userLastName, chatId);
      
      if (isNewUser) {
        await sendMessage(chatId, `${userFirstName}님이 러닝 마라톤에 참가하셨습니다! 🎉`);
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
          const downloadUrl = await downloadAndUploadFile(fileUrl, userId, chatId);
          
          // 3. 체크인 데이터 Firestore에 저장
          await saveCheckinToFirestore(
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
          await saveCheckinToFirestore(
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
    } catch (error) {
      console.error('체크인 처리 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      await sendMessage(chatId, `체크인 처리 중 오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
    }
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