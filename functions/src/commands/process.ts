import { TelegramUpdate } from '../types/TelegramUpdate';
import admin from '../firebase';

// Command processing function
export async function processCommand(update: TelegramUpdate) {
    if (!update.message || !update.message.text) return;
  
    const text = update.message.text;
    const chatId = update.message.chat?.id;
    const userId = update.message.from?.id;
    if (!chatId || !userId) return;
  
    if (text.startsWith('/checkin')) {
      const parts = text.split(' ');
      const content = parts[1] || '';
  
      // TODO: Validate 'content' (image URL or file) if needed
  
      await admin.firestore().collection('checkins').add({
        userId,
        chatId,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      console.log(`User ${userId} checked in.`);
    } else if (text.startsWith('/today')) {
      // TODO: Query Firestore for today’s check-ins and identify missing ones
      console.log('Processing /today command.');
    } else if (text.startsWith('/status')) {
      // TODO: Calculate group streak based on check-ins and holidays
      console.log('Processing /status command.');
    }
  }
  