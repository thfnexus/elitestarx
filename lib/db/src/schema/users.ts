import { pgTable, text, serial, timestamp, boolean, numeric, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  uplinerId: integer("upliner_id"),
  balance: numeric("balance", { precision: 12, scale: 4 }).notNull().default("0"),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 4 }).notNull().default("0"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 12, scale: 4 }).notNull().default("0"),
  referralCount: integer("referral_count").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  hasActivePlan: boolean("has_active_plan").notNull().default(false),
  whatsappNumber: text("whatsapp_number"),
  profileImage: text("profile_image"),
  level: integer("level").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  globalPoolEligible: boolean("global_pool_eligible").notNull().default(true),
  dynamicAdRatePkr: integer("dynamic_ad_rate_pkr").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uplinerIdx: index("upliner_idx").on(table.uplinerId),
}));

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
