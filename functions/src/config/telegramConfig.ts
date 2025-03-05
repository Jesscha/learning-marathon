import * as functions from 'firebase-functions';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// .env 파일 로드 시도
const loadEnvFile = () => {
  // 여러 가능한 경로 시도
  const possiblePaths = [
    path.resolve(__dirname, '../../../../.env'),  // 프로젝트 루트
    path.resolve(__dirname, '../../../.env'),     // functions 디렉토리
    path.resolve(__dirname, '../../.env'),        // functions/src 디렉토리
    path.resolve(__dirname, '../.env'),           // functions/src/config 디렉토리
    path.resolve(process.cwd(), '.env')           // 현재 작업 디렉토리
  ];
  
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`환경 변수: ${envPath}에서 .env 파일을 로드했습니다.`);
      return true;
    }
  }
  
  console.log('환경 변수: .env 파일을 찾을 수 없습니다.');
  return false;
};

// .env 파일 로드 시도
loadEnvFile();

/**
 * 텔레그램 봇 설정 가져오기
 */
export function getTelegramConfig() {
  let botToken = '';
  
  try {
    // 1. 먼저 환경 변수에서 토큰 가져오기 시도
    botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    
    if (botToken) {
      console.log('환경 변수에서 봇 토큰을 로드했습니다.');
      return createConfig(botToken);
    }
    
    // 2. 환경 변수에 없으면 Firebase 구성에서 가져오기 시도
    try {
      botToken = functions.config().telegram?.bot_token || '';
      
      if (botToken) {
        console.log('Firebase 구성에서 봇 토큰을 로드했습니다.');
        return createConfig(botToken);
      }
    } catch (configError) {
      console.log('Firebase 구성에서 봇 토큰을 가져오는 데 실패했습니다:', configError);
      // Firebase 구성 오류는 무시하고 계속 진행
    }
    
    // 3. 두 방법 모두 실패한 경우 오류 발생
    throw new Error(
      '텔레그램 봇 토큰이 설정되지 않았습니다. ' +
      '.env 파일에 TELEGRAM_BOT_TOKEN을 설정하거나 ' +
      'firebase functions:config:set telegram.bot_token="YOUR_TOKEN"을 실행하세요.'
    );
  } catch (error) {
    console.error('봇 토큰을 가져오는 중 오류가 발생했습니다:', error);
    throw error;
  }
}

/**
 * 봇 토큰으로 설정 객체 생성
 */
function createConfig(botToken: string) {
  return {
    botToken,
    apiUrl: `https://api.telegram.org/bot${botToken}`,
    fileApiUrl: `https://api.telegram.org/file/bot${botToken}`
  };
}

// 기본 설정 내보내기
export const telegramConfig = getTelegramConfig(); 