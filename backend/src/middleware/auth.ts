import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthRequest extends Request {
  telegramUser?: {
    id: number;
    username?: string;
    first_name?: string;
  };
}

export function verifyTelegramAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  if (process.env.NODE_ENV === 'development' && initData === 'dev') {
    req.telegramUser = { id: 1, username: 'devuser' };
    return next();
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return res.status(401).json({ error: 'Missing hash' });

    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN!)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (expectedHash !== hash) {
      return res.status(401).json({ error: 'Invalid hash' });
    }

    const userParam = params.get('user');
    if (userParam) {
      req.telegramUser = JSON.parse(decodeURIComponent(userParam));
    }

    next();
  } catch {
    res.status(401).json({ error: 'Auth failed' });
  }
}
