import dotenv from 'dotenv';

dotenv.config();

const authConfig = {
  secret: process.env.AUTH_SECRET || 'secret',
};

export default authConfig;
