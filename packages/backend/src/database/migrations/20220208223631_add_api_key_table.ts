import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable('api_keys'))) {
        await knex.schema.createTable('api_keys', (tableBuilder) => {
            tableBuilder
                .integer('user_id')
                .notNullable()
                .references('user_id')
                .inTable('users')
                .onDelete('CASCADE');
            tableBuilder.text('description').notNullable();
            tableBuilder
                .timestamp('created_at', { useTz: false })
                .notNullable()
                .defaultTo(knex.fn.now());
            tableBuilder.text('api_key_hash').notNullable().primary();
            tableBuilder.timestamp('expires_at', { useTz: false }).nullable();
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('api_keys');
}
