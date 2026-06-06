import 'dotenv/config';
import { migrate, pool } from './pool';

migrate().then(() => pool.end()).catch(console.error);
