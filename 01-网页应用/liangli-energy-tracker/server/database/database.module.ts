import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';

export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';

export type PostgresJsDatabase = ReturnType<typeof drizzle>;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: (): PostgresJsDatabase => {
        const connectionString =
          process.env.DATABASE_URL ||
          'postgres://postgres:postgres@localhost:5432/liangli';
        const client = postgres(connectionString, { max: 10 });
        return drizzle(client, {
          schema: require('./schema'),
        });
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule {}
