import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable("schedules", {
    id: integer().primaryKey({ autoIncrement: true }),
    scheduled_time: text().notNull(),
    message: text().notNull(),
    attachment: text().$type<string | null>().default(null),
    contact_ids: text({ mode: "json" }).$type<string>().notNull()
});

export const blockedUsers = sqliteTable("blocked_users", {
    id: integer().primaryKey({ autoIncrement: true }),
    block_reason: text(),
    contact_id: text().notNull(),
    blocked_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});

export const groupSettings = sqliteTable("group_settings", {
    id: integer().primaryKey({ autoIncrement: true }),
    group_id: text().notNull(),
    settings: text({ mode: "json" }).$type<Array<{ key: string, value: boolean }>>().notNull()
})