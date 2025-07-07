import { drizzle } from 'drizzle-orm/better-sqlite3';
import { databaseUrl } from '../shared/constant/env';
import Database from 'better-sqlite3';

const sqlite = new Database(databaseUrl);
const db = drizzle(sqlite);

export default db