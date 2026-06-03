import dotenv from 'dotenv';
import path from 'path';

// Load .env before any service reads process.env (imports are hoisted in server.ts).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
