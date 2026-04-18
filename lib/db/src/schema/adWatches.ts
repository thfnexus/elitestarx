import { pgTable, serial, timestamp, integer, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adWatchesTable = pgTable("ad_watches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  adId: text("ad_id").notNull(),
  earned: numeric("earned", { precision: 12, scale: 4 }).notNull(),
  watchedAt: timestamp("watched_at", { withTimezone: true }).notNull().defaultNow(),
  watchDate: text("watch_date").notNull(),
});

export const insertAdWatchSchema = createInsertSchema(adWatchesTable).omit({ id: true, watchedAt: true });
export type InsertAdWatch = z.infer<typeof insertAdWatchSchema>;
export type AdWatch = typeof adWatchesTable.$inferSelect;
