import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable("schedules", {
    id: integer().primaryKey({ autoIncrement: true }),
    scheduled_time: text().notNull(),
    message: text().notNull(),
    contact_ids: text({ mode: "json" }).$type<string>().notNull()
});

export const filteredMessages = sqliteTable("filtered_messages", {
    id: integer().primaryKey({ autoIncrement: true }),
    label: text().notNull(),
    filter_keywords: text().$type<string[]>().default([]),
    auto_response: text().notNull(),
    pinned_contact: text({ mode: "json" }).$type<string[]>().default([])
});

export const blockedUsers = sqliteTable("blocked_users", {
    id: integer().primaryKey({ autoIncrement: true }),
    block_reason: text(),
    contact_id: text().notNull(),
    blocked_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});
