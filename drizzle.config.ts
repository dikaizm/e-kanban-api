import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MYSQL_DATABASE) {
  console.error('Please set the MYSQL_DATABASE environment variable');
  process.exit(1);
}

export default {
  schema: './src/**/*.models.ts',
  out: './src/db/migrations',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE,
  },
} satisfies Config;
