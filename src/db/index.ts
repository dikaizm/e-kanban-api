import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import { mysqlConfig } from '../config/database';

const connection = mysql.createConnection({
  host: mysqlConfig.host,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
});

export const db = drizzle(connection);
