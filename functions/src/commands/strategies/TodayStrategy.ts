import { CommandStrategy } from './CommandStrategy';
import { TelegramUpdate } from '../../types/TelegramUpdate';
import { commandContext } from '../CommandContext';
import * as admin from 'firebase-admin';
import { sendMessage } from '../../utils/telegramUtils';
import { CheckIn } from '../../types/CheckIn';
import { 
  getTodayDateString, 
  getTodayKoreanString 
} from '../../utils/dateUtils';

export class TodayStrategy implements CommandStrategy {
  async execute(update: TelegramUpdate, args: string[]): Promise<void> {
    const chatId = update.message?.chat?.id;
    if (!chatId) throw new Error('채팅 ID가 누락되었습니다. 텔레그램 계정 정보를 확인해주세요.');
    
    try {
      // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
      const today = getTodayDateString();
      console.log(`오늘 날짜(KST): ${today}`);
      
      // 체크인 데이터 조회
      const checkins = await this.fetchTodayCheckins(today);
      
      // 체크인 데이터가 없는 경우
      if (!checkins || checkins.length === 0) {
        await this.sendNoCheckinsMessage(chatId);
        return;
      }
      
      // 체크인 데이터 처리 및 메시지 전송
      const uniqueUsers = this.getUniqueUsers(checkins);
      const message = this.createCheckinMessage(uniqueUsers);
      await sendMessage(chatId, message);
      
    } catch (error) {
      console.error('체크인 상태 조회 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`체크인 상태 조회 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 오늘의 체크인 데이터 조회
   * @param dateId 날짜 ID (YYYY-MM-DD 형식)
   * @returns 체크인 데이터 배열
   */
  private async fetchTodayCheckins(dateId: string): Promise<CheckIn[]> {
    // Firestore에서 오늘 날짜의 체크인 데이터 조회
    const dayRef = admin.firestore().collection('days').doc(dateId);
    const dayDoc = await dayRef.get();
    
    if (!dayDoc.exists) {
      return [];
    }
    
    // 체크인 데이터 가져오기
    const checkinsSnapshot = await dayRef.collection('checkins').get();
    
    if (checkinsSnapshot.empty) {
      return [];
    }
    
    // 체크인 데이터 정리
    const checkins: CheckIn[] = [];
    checkinsSnapshot.forEach(doc => {
      checkins.push(doc.data() as CheckIn);
    });
    
    return checkins;
  }
  
  /**
   * 체크인이 없을 때 메시지 전송
   * @param chatId 채팅 ID
   */
  private async sendNoCheckinsMessage(chatId: number): Promise<void> {
    const koreanDate = getTodayKoreanString();
    await sendMessage(chatId, `오늘(${koreanDate})은 아직 체크인한 사람이 없습니다. 첫 번째 체크인을 해보세요! 🚀`);
  }
  
  /**
   * 중복 사용자 제거 (한 사용자가 여러 번 체크인한 경우 한 번만 표시)
   * @param checkins 체크인 데이터 배열
   * @returns 중복이 제거된 사용자 Map
   */
  private getUniqueUsers(checkins: CheckIn[]): Map<string, CheckIn> {
    const uniqueUsers = new Map<string, CheckIn>();
    checkins.forEach(checkin => {
      uniqueUsers.set(checkin.userId, checkin);
    });
    return uniqueUsers;
  }
  
  /**
   * 체크인 메시지 생성
   * @param uniqueUsers 중복이 제거된 사용자 Map
   * @returns 포맷팅된 메시지
   */
  private createCheckinMessage(uniqueUsers: Map<string, CheckIn>): string {
    const koreanDate = getTodayKoreanString();
    const messageTitle = `🏃‍♂️ 러닝마라톤 - ${koreanDate}`;
    let messageBody = '';
    
    // 체크인 목록 생성
    uniqueUsers.forEach(checkin => {
      messageBody += `${checkin.userFirstName} ✅\n`;
    });
    
    // 최종 메시지 조합
    return `${messageTitle}\n\n${messageBody}`;
  }

  getDescription(): string {
    return '오늘의 체크인 현황을 보여줍니다.';
  }

  getUsage(): string {
    return '/today';
  }
}

// 전략 등록
commandContext.registerStrategy('today', new TodayStrategy()); 