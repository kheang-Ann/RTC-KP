import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
}));
