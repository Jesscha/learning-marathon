import * as functions from 'firebase-functions';
import express from 'express';
import { TelegramUpdate } from './types/TelegramUpdate';
import { processCommand } from './commands/process';

// Create an Express app to handle HTTP POST requests
const app = express();
app.use(express.json());
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body as TelegramUpdate;

    // TelegramUpdate 형식이 맞는지 확인
    if (!update.message || !update.message.chat || !update.message.from) {
      throw new Error('Invalid TelegramUpdate format');
    }

    console.log('Received webhook update:', update);

    await processCommand(update);

    // Respond quickly to Telegram to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook update:', error);
    res.status(400).send('Invalid request body');
  }
});

// Export the Express app as a Firebase Cloud Function
export const telegramWebhook = functions.https.onRequest(app);