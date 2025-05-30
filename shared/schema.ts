import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  lastSyncTime: timestamp("last_sync_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commits = pgTable("commits", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id),
  sha: text("sha").notNull(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  authorEmail: text("author_email"),
  date: timestamp("date").notNull(),
  additions: integer("additions").default(0),
  deletions: integer("deletions").default(0),
  filesChanged: integer("files_changed").default(0),
  url: text("url"),
  processed: boolean("processed").default(false),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  tags: text("tags").array(),
  hivePostId: text("hive_post_id"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").notNull().default("draft"), // draft, published, scheduled
  commitsIncluded: jsonb("commits_included"),
  aiTokensUsed: integer("ai_tokens_used").default(0),
});

export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
});

export const insertCommitSchema = createInsertSchema(commits).omit({
  id: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;

export type Commit = typeof commits.$inferSelect;
export type InsertCommit = z.infer<typeof insertCommitSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;

// API Response types
export type DashboardStats = {
  activeRepos: number;
  newCommits: number;
  postsPublished: number;
  aiUsage: number;
};

export type RecentCommitWithRepo = Commit & {
  repository: Repository;
};

export type CommitSummary = {
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  repositories: string[];
  timeRange: {
    from: string;
    to: string;
  };
};

export type AISummaryResponse = {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  tokensUsed: number;
};
