import * as functions from 'firebase-functions';
import * as todayReminder from './cron/todayReminder';
import * as streakChecker from './cron/streakChecker';
import { listeningWebhook } from './commands/listeningWebhook';

// Firebase Functions로만 내보내기
export const telegramWebhook = functions.https.onRequest(listeningWebhook);
export const eveningReminder = todayReminder.eveningReminder;
export const nightReminder = todayReminder.nightReminder;
export const streakCheckOnMidnight = streakChecker.streakCheckOnMidnight;