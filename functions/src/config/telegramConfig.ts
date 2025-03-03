import * as functions from 'firebase-functions';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// 환경 설정 로드
const isLocalEnvironment = process.env.NODE_ENV !== 'production';

// 로컬 개발 환경에서 .env 파일 로드
if (isLocalEnvironment) {
  // 프로젝트 루트 디렉토리의 .env 파일 경로
  const envPath = path.resolve(__dirname, '../../../../.env');
  
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('로컬 환경: .env 파일에서 환경 변수를 로드했습니다.');
  } else {
    console.warn('로컬 환경: .env 파일을 찾을 수 없습니다.');
  }
}

/**
 * 텔레그램 봇 설정을 가져오는 함수
 * @returns 텔레그램 봇 설정 객체
 */
export function getTelegramConfig() {
  let botToken: string;

  try {
    if (isLocalEnvironment) {
      // 로컬 환경: .env 파일에서 토큰 가져오기
      botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      if (!botToken) {
        console.error('로컬 환경: TELEGRAM_BOT_TOKEN이 .env 파일에 설정되지 않았습니다.');
      }
    } else {
      // 원격 환경: Firebase 구성에서 토큰 가져오기
      botToken = functions.config().telegram?.bot_token || '';
      if (!botToken) {
        console.error('원격 환경: telegram.bot_token이 Firebase 구성에 설정되지 않았습니다.');
      }
    }
  } catch (error) {
    console.error('봇 토큰을 가져오는 중 오류가 발생했습니다:', error);
    botToken = '';
  }

  // 토큰이 없으면 오류 발생
  if (!botToken) {
    throw new Error(
      '텔레그램 봇 토큰이 설정되지 않았습니다. ' +
      '로컬 환경에서는 .env 파일에 TELEGRAM_BOT_TOKEN을 설정하고, ' +
      '원격 환경에서는 firebase functions:config:set telegram.bot_token="YOUR_TOKEN"을 실행하세요.'
    );
  }

  return {
    botToken,
    apiUrl: `https://api.telegram.org/bot${botToken}`,
    fileApiUrl: `https://api.telegram.org/file/bot${botToken}`
  };
}

// 기본 설정 내보내기
export const telegramConfig = getTelegramConfig(); 