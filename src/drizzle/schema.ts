import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const noteCategory = pgEnum("note_category", [
  "personal",
  "work",
  "ideas",
  "other",
]);

export const noteStatus = pgEnum("note_status", ["todo", "in_progress", "done"]);
export const noteBlockType = pgEnum("note_block_type", [
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulleted_list",
  "numbered_list",
  "todo",
  "quote",
  "code",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (token) => ({
    compoundKey: primaryKey({ columns: [token.identifier, token.token] }),
  }),
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled"),
    content: text("content").notNull().default(""),
    parentId: uuid("parent_id"),
    icon: text("icon"),
    coverImage: text("cover_image"),
    position: integer("position").notNull().default(0),
    category: noteCategory("category").notNull().default("other"),
    status: noteStatus("status").notNull().default("todo"),
    pinned: boolean("pinned").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notes_user_updated_idx").on(table.userId, table.pinned, table.updatedAt),
    index("notes_user_parent_position_idx").on(table.userId, table.parentId, table.position),
    index("notes_user_archived_idx").on(table.userId, table.isArchived, table.updatedAt),
    index("notes_user_favorite_idx").on(table.userId, table.isFavorite, table.updatedAt),
  ],
);

export const noteBlocks = pgTable(
  "note_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    type: noteBlockType("type").notNull().default("paragraph"),
    content: text("content").notNull().default(""),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("note_blocks_note_position_idx").on(table.noteId, table.position),
  ],
);

export type SelectNote = typeof notes.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

export const noteBlocksRelations = relations(noteBlocks, ({ one }) => ({
  note: one(notes, {
    fields: [noteBlocks.noteId],
    references: [notes.id],
  }),
}));
