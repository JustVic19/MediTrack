import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection using postgresJS
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/meditrack';
const queryClient = postgres(connectionString);

// Initialize Drizzle with the connection and schema
export const db = drizzle(queryClient, { schema });