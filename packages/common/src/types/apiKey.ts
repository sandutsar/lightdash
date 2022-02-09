export type ApiKey = {
    createdAt: Date;
    expiresAt: Date | undefined;
    description: string;
};

export type CreateApiKey = Pick<ApiKey, 'expiresAt' | 'description'>;
