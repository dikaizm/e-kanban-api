import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MYSQL_DATABASE) {
  console.error('Please set the MYSQL_DATABASE environment variable');
  process.exit(1);
}

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'test',
};

export { mysqlConfig };
