import { Knex } from 'knex';

export type DbApiKey = {
    api_key_hash: string;
    user_id: number;
    created_at: Date;
    description: string;
    expires_at: Date | undefined;
};

type DbCreateApiKey = Omit<DbApiKey, 'created_at'>;
export type ApiKeyTable = Knex.CompositeTableType<DbApiKey, DbCreateApiKey>;
export const ApiKeyTableName = 'api_keys';
