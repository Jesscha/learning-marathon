import * as functions from 'firebase-functions';
import express from 'express';
import { TelegramUpdate } from './types/TelegramUpdate';
import { processCommand } from './commands/process';
import { sendMessage } from './utils/telegramUtils';
import * as todayReminder from './cron/todayReminder';
import * as streakChecker from './cron/streakChecker';

// Express 앱 생성
const app = express();
app.use(express.json());

// 헬스 체크 엔드포인트 추가
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.post('/webhook', async (req, res) => {
  try {
    const update = req.body as TelegramUpdate;

    // TelegramUpdate 형식이 맞는지 확인
    if (!update.message || !update.message.chat || !update.message.from) {
      throw new Error('Invalid TelegramUpdate format');
    }

    console.log('Received webhook update:', update);

    try {
      // 명령어 처리
      await processCommand(update);
    } catch (error) {
      // 오류 로깅
      console.error('Command processing error:', error);
      
      // 사용자에게 오류 메시지 전송
      const chatId = update.message.chat.id;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      await sendMessage(chatId, `명령어 처리 중 오류가 발생했습니다: ${errorMessage}`);
    }

    // Respond quickly to Telegram to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    // 웹훅 처리 자체의 오류 (예: 잘못된 요청 형식)
    console.error('Error processing webhook update:', error);
    res.status(400).send('Invalid request body');
  }
});

// Firebase Functions로만 내보내기
export const telegramWebhook = functions.https.onRequest(app);
export const eveningReminder = todayReminder.eveningReminder;
export const nightReminder = todayReminder.nightReminder;
export const streakCheckOnMidnight = streakChecker.streakCheckOnMidnight;