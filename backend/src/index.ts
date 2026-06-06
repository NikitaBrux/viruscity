import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import { migrate } from './db/pool';
import { verifyTelegramAuth } from './middleware/auth';
import playerRouter from './routes/player';
import gameRouter from './routes/game';
import pvpRouter, { initPvPRouter } from './routes/pvp';
import allianceRouter from './routes/alliance';
import { PvPService } from './services/PvPService';
import { startOfflineProgressJob } from './jobs/offlineProgress';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: false });
const pvpService = new PvPService(bot);

app.use('/api/player', verifyTelegramAuth, playerRouter);
app.use('/api/game', verifyTelegramAuth, gameRouter);
app.use('/api/pvp', verifyTelegramAuth, initPvPRouter(pvpService));
app.use('/api/alliance', verifyTelegramAuth, allianceRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

async function bootstrap() {
  await migrate();
  startOfflineProgressJob(pvpService);
  app.listen(PORT, () => console.log(`VirusCity backend running on :${PORT}`));
}

bootstrap().catch(console.error);
