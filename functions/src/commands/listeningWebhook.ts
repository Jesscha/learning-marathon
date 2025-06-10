import express, { Request, Response } from 'express';
import { TelegramUpdate } from '../types/TelegramUpdate';
import { processCommand } from './process';
import { sendMessage } from '../utils/telegramUtils';

// Express 앱 생성
const listeningWebhook = express();
listeningWebhook.use(express.json());

// 헬스 체크 엔드포인트 추가
listeningWebhook.get('/', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

listeningWebhook.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body as TelegramUpdate;

    // TelegramUpdate 형식이 맞는지 확인
    if (!update.message || !update.message.chat || !update.message.from) {
      throw new Error('Invalid TelegramUpdate format: ' + JSON.stringify(req.body, null, 2));
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

    // 알 수 없는 형식의 업데이트이지만, 텔레그램 서버의 재시도를 방지하기 위해 200 응답
    res.status(200).send('OK');
  }
});

export { listeningWebhook };
