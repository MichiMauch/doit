import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  estimatedHours: integer("estimated_hours"), // Geschätzte Stunden für die Aufgabe
  tags: text("tags"), // JSON string für Tags
  calendarLinked: integer("calendar_linked", { mode: "boolean" }).default(false),
  emailSource: text("email_source"), // E-Mail ID falls aus E-Mail erstellt
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo").notNull(), // NEU: Status-Feld
  userEmail: text("user_email").notNull(), // NEU: Multi-User Support
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

// Frontend type without userEmail (API adds this automatically)
export type TodoFormData = Omit<NewTodo, "id" | "createdAt" | "updatedAt" | "userEmail">;
