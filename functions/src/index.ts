import * as functions from 'firebase-functions';
import express from 'express';
import { TelegramUpdate } from './types/TelegramUpdate';
import { processCommand } from './commands/process';

// Create an Express app to handle HTTP POST requests
const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const update = req.body as TelegramUpdate;
  console.log('Received webhook update:', update);

  await processCommand(update);

  // Respond quickly to Telegram to acknowledge receipt
  res.sendStatus(200);
});

// Export the Express app as a Firebase Cloud Function
export const telegramWebhook = functions.https.onRequest(app);