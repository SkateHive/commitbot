import { repositories, commits, blogPosts, botConfig, type Repository, type InsertRepository, type Commit, type InsertCommit, type BlogPost, type InsertBlogPost, type BotConfig, type InsertBotConfig, type DashboardStats, type RecentCommitWithRepo, type CommitSummary, type RepositoryConfig } from "@shared/schema";

export interface IStorage {
  // Repository methods
  getRepositories(): Promise<Repository[]>;
  getActiveRepositories(): Promise<Repository[]>;
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoryByName(owner: string, name: string): Promise<Repository | undefined>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined>;
  deleteRepository(id: number): Promise<boolean>;

  // Add the setRepositories method here
  setRepositories(repos: InsertRepository[]): Promise<void>;

  // Repository methods
  getRepositories(): Promise<Repository[]>;
  getActiveRepositories(): Promise<Repository[]>;
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoryByName(owner: string, name: string): Promise<Repository | undefined>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: number, repository: Partial<InsertRepository>): Promise<Repository | undefined>;
  deleteRepository(id: number): Promise<boolean>;

  // Commit methods
  getCommits(repositoryId?: number, limit?: number): Promise<Commit[]>;
  getUnprocessedCommits(): Promise<Commit[]>;
  getCommitsBySha(sha: string): Promise<Commit | undefined>;
  getCommitsSince(since: Date, repositoryId?: number): Promise<Commit[]>;
  getRecentCommitsWithRepo(limit?: number): Promise<RecentCommitWithRepo[]>;
  createCommit(commit: InsertCommit): Promise<Commit>;
  createCommits(commits: InsertCommit[]): Promise<Commit[]>;
  markCommitsAsProcessed(commitIds: number[]): Promise<void>;

  // Blog post methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;

  // Bot config methods
  getConfig(key: string): Promise<BotConfig | undefined>;
  setConfig(key: string, value: string): Promise<BotConfig>;
  getAllConfig(): Promise<BotConfig[]>;

  // Dashboard methods
  getDashboardStats(): Promise<DashboardStats>;
  getCommitsSummary(since: Date): Promise<CommitSummary>;
}

export class MemStorage implements IStorage {
  private repositories: Map<number, Repository>;
  private commits: Map<number, Commit>;
  private blogPosts: Map<number, BlogPost>;
  private botConfigs: Map<string, BotConfig>;
  private currentRepoId: number;
  private currentCommitId: number;
  private currentPostId: number;
  private currentConfigId: number;

  constructor() {
    this.repositories = new Map();
    this.commits = new Map();
    this.blogPosts = new Map();
    this.botConfigs = new Map();
    this.currentRepoId = 1;
    this.currentCommitId = 1;
    this.currentPostId = 1;
    this.currentConfigId = 1;
  }

  async getRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  async getActiveRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(repo => repo.isActive);
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByName(owner: string, name: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(
      repo => repo.owner === owner && repo.name === name
    );
  }

  async createRepository(insertRepo: InsertRepository): Promise<Repository> {
    const id = this.currentRepoId++;
    const repository: Repository = {
      ...insertRepo,
      id,
      createdAt: new Date(),
      description: insertRepo.description || null,
      isActive: insertRepo.isActive ?? true,
      lastSyncTime: insertRepo.lastSyncTime || null,
    };
    this.repositories.set(id, repository);
    return repository;
  }

  async updateRepository(id: number, updates: Partial<InsertRepository>): Promise<Repository | undefined> {
    const existing = this.repositories.get(id);
    if (!existing) return undefined;

    const updated: Repository = { ...existing, ...updates };
    this.repositories.set(id, updated);
    return updated;
  }

  async setRepositories(repos: InsertRepository[]): Promise<void> {
    for (const repo of repos) {
      await this.createRepository(repo);
    }
  }

  async deleteRepository(id: number): Promise<boolean> {
    return this.repositories.delete(id);
  }

  async getCommits(repositoryId?: number, limit?: number): Promise<Commit[]> {
    let commits = Array.from(this.commits.values());

    if (repositoryId) {
      commits = commits.filter(commit => commit.repositoryId === repositoryId);
    }

    commits.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (limit) {
      commits = commits.slice(0, limit);
    }

    return commits;
  }

  async getUnprocessedCommits(): Promise<Commit[]> {
    return Array.from(this.commits.values()).filter(commit => !commit.processed);
  }

  async getCommitsBySha(sha: string): Promise<Commit | undefined> {
    return Array.from(this.commits.values()).find(commit => commit.sha === sha);
  }

  async getCommitsSince(since: Date, repositoryId?: number): Promise<Commit[]> {
    let commits = Array.from(this.commits.values()).filter(commit => commit.date >= since);

    if (repositoryId) {
      commits = commits.filter(commit => commit.repositoryId === repositoryId);
    }

    return commits.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getRecentCommitsWithRepo(limit = 10): Promise<RecentCommitWithRepo[]> {
    const commits = await this.getCommits(undefined, limit);
    const result: RecentCommitWithRepo[] = [];

    for (const commit of commits) {
      const repository = await this.getRepository(commit.repositoryId!);
      if (repository) {
        result.push({ ...commit, repository });
      }
    }

    return result;
  }

  async createCommit(insertCommit: InsertCommit): Promise<Commit> {
    const id = this.currentCommitId++;
    const commit: Commit = {
      ...insertCommit,
      id,
      repositoryId: insertCommit.repositoryId || null,
      authorEmail: insertCommit.authorEmail || null,
      additions: insertCommit.additions || null,
      deletions: insertCommit.deletions || null,
      filesChanged: insertCommit.filesChanged || null,
      url: insertCommit.url || null,
      processed: insertCommit.processed ?? false,
    };
    this.commits.set(id, commit);
    return commit;
  }

  async createCommits(insertCommits: InsertCommit[]): Promise<Commit[]> {
    const commits: Commit[] = [];
    for (const insertCommit of insertCommits) {
      const commit = await this.createCommit(insertCommit);
      commits.push(commit);
    }
    return commits;
  }

  async markCommitsAsProcessed(commitIds: number[]): Promise<void> {
    for (const id of commitIds) {
      const commit = this.commits.get(id);
      if (commit) {
        this.commits.set(id, { ...commit, processed: true });
      }
    }
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentPostId++;
    const post: BlogPost = {
      ...insertPost,
      id,
      createdAt: new Date(),
      status: insertPost.status || "draft",
      summary: insertPost.summary || null,
      tags: insertPost.tags || null,
      hivePostId: insertPost.hivePostId || null,
      publishedAt: insertPost.publishedAt || null,
      commitsIncluded: insertPost.commitsIncluded || null,
      aiTokensUsed: insertPost.aiTokensUsed || null,
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existing = this.blogPosts.get(id);
    if (!existing) return undefined;

    const updated: BlogPost = { ...existing, ...updates };
    this.blogPosts.set(id, updated);
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async getConfig(key: string): Promise<BotConfig | undefined> {
    return this.botConfigs.get(key);
  }

  async setConfig(key: string, value: string): Promise<BotConfig> {
    const existing = this.botConfigs.get(key);
    const config: BotConfig = {
      id: existing?.id || this.currentConfigId++,
      key,
      value,
      updatedAt: new Date(),
    };
    this.botConfigs.set(key, config);
    return config;
  }

  async getAllConfig(): Promise<BotConfig[]> {
    return Array.from(this.botConfigs.values());
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const activeRepos = await this.getActiveRepositories();
    const allCommits = await this.getCommits();
    const allPosts = await this.getBlogPosts();

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newCommits = allCommits.filter(commit => commit.date >= lastWeek);
    const publishedPosts = allPosts.filter(post => post.status === 'published');

    const aiUsage = allPosts.reduce((sum, post) => sum + (post.aiTokensUsed || 0), 0);

    return {
      activeRepos: activeRepos.length,
      newCommits: newCommits.length,
      postsPublished: publishedPosts.length,
      aiUsage,
    };
  }

  async getCommitsSummary(since: Date): Promise<CommitSummary> {
    const commits = await this.getCommitsSince(since);
    const repoIds = Array.from(new Set(commits.map(c => c.repositoryId).filter(id => id !== null)));
    const repositories: string[] = [];

    for (const repoId of repoIds) {
      const repo = await this.getRepository(repoId!);
      if (repo) {
        repositories.push(`${repo.owner}/${repo.name}`);
      }
    }

    return {
      totalCommits: commits.length,
      totalAdditions: commits.reduce((sum, c) => sum + (c.additions || 0), 0),
      totalDeletions: commits.reduce((sum, c) => sum + (c.deletions || 0), 0),
      repositories,
      timeRange: {
        from: since.toISOString(),
        to: new Date().toISOString(),
      },
    };
  }
}

export const storage = new MemStorage();
