import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

function isPlaceholderDatabaseUrl(value: string | undefined) {
	return !value || value.includes('user:password@host:port/db-name');
}

function createDb(databaseUrl: string) {
	const client = postgres(databaseUrl);
	return drizzle(client, { schema });
}

type Database = ReturnType<typeof createDb>;

function unavailableDb(): Database {
	return new Proxy(
		{},
		{
			get() {
				throw new Error('DATABASE_URL must be set to a real Postgres connection URL before using the app.');
			}
		}
	) as Database;
}

if (!building && isPlaceholderDatabaseUrl(env.DATABASE_URL)) {
	throw new Error('DATABASE_URL must be set to a real Postgres connection URL before using the app.');
}

export const db =
	building && isPlaceholderDatabaseUrl(env.DATABASE_URL) ? unavailableDb() : createDb(env.DATABASE_URL!);
