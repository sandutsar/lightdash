import { ApiKey, CreateApiKey, SessionUser } from 'common';
import * as crypto from 'crypto';
import { Knex } from 'knex';
import { DbApiKey } from '../../database/entities/apiKeys';
import { NotFoundError, UnexpectedDatabaseError } from '../../errors';

export class ApiKeyModel {
    private readonly database: Knex;

    constructor({ database }: { database: Knex }) {
        this.database = database;
    }

    static _hash(s: string): string {
        return crypto.createHash('sha256').update(s).digest('hex');
    }

    static mapDbObjectToApiKey(data: DbApiKey): ApiKey {
        return {
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            description: data.description,
        };
    }

    async getApiKeyByKey(apiKey: string): Promise<ApiKey & { userId: number }> {
        const [row] = await this.database('api_keys').where(
            'api_key_hash',
            ApiKeyModel._hash(apiKey),
        );
        if (row === undefined) {
            throw new NotFoundError('Api key not valid');
        }
        return {
            ...ApiKeyModel.mapDbObjectToApiKey(row),
            userId: row.user_id,
        };
    }

    async findApiKeysForUser(userUuid: string): Promise<ApiKey[]> {
        const rows = await this.database('api_keys')
            .select('*')
            .innerJoin('users', 'api_keys.user_id', 'users.user_id')
            .where('users.user_uuid', userUuid);
        return rows.map(ApiKeyModel.mapDbObjectToApiKey);
    }

    async createApiKey(
        user: SessionUser,
        data: CreateApiKey,
    ): Promise<ApiKey & { apiKey: string }> {
        const apiKey = crypto.randomBytes(16).toString('hex');
        const apiKeyHash = ApiKeyModel._hash(apiKey);
        const [row] = await this.database('api_keys')
            .insert({
                user_id: user.userId,
                expires_at: data.expiresAt,
                description: data.description,
                api_key_hash: apiKeyHash,
            })
            .returning('*');
        if (row === undefined) {
            throw new UnexpectedDatabaseError('Could not create API Key');
        }
        return {
            ...data,
            createdAt: row.created_at,
            apiKey,
        };
    }
}
