import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GitHubService } from "./lib/github";
import { OpenAIService } from "./lib/openai";
import { HiveService } from "./lib/hive";
import { ConfigManager } from "./lib/config";
import { insertRepositorySchema, insertBlogPostSchema, type CommitData } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const configManager = new ConfigManager();
  
  // Initialize services
  const getGitHubService = () => {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN;
    if (!token) throw new Error("GitHub token not found in environment variables");
    return new GitHubService(token);
  };

  const getOpenAIService = () => {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_TOKEN;
    if (!apiKey) throw new Error("OpenAI API key not found in environment variables");
    return new OpenAIService(apiKey);
  };

  const getHiveService = () => {
    const postingKey = process.env.HIVE_POSTING_KEY || process.env.HIVE_PRIVATE_KEY;
    const username = process.env.HIVE_USERNAME || 'skatehive.dev';
    if (!postingKey) throw new Error("Hive posting key not found in environment variables");
    return new HiveService(postingKey, username);
  };

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/repositories", async (req, res) => {
    try {
      const repositories = await storage.getRepositories();
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  app.post("/api/repositories", async (req, res) => {
    try {
      const repoData = insertRepositorySchema.parse(req.body);
      
      // Validate repository exists on GitHub
      const githubService = getGitHubService();
      const isValid = await githubService.validateRepository(repoData.owner, repoData.name);
      
      if (!isValid) {
        return res.status(400).json({ error: "Repository not found on GitHub" });
      }

      const repository = await storage.createRepository(repoData);
      
      // Update config file
      const repos = await configManager.loadRepositories();
      repos.push({
        owner: repoData.owner,
        name: repoData.name,
        description: repoData.description,
        isActive: repoData.isActive ?? true,
      });
      await configManager.saveRepositories(repos);
      
      res.json(repository);
    } catch (error) {
      res.status(400).json({ error: "Invalid repository data" });
    }
  });

  app.get("/api/commits", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const commits = await storage.getRecentCommitsWithRepo(limit);
      res.json(commits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commits" });
    }
  });

  // Sync endpoint
  app.post("/api/sync", async (req, res) => {
    try {
      const githubService = getGitHubService();
      const config = await configManager.loadConfig();
      const repositories = await storage.getActiveRepositories();
      
      let totalNewCommits = 0;
      const errors: string[] = [];

      for (const repo of repositories) {
        try {
          const lastSync = repo.lastSyncTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
          const githubCommits = await githubService.getCommitsSince(repo.owner, repo.name, lastSync);
          
          for (const githubCommit of githubCommits) {
            const existing = await storage.getCommitsBySha(githubCommit.sha);
            if (!existing) {
              // Get detailed commit info including stats
              const detailedCommit = await githubService.getCommitDetails(repo.owner, repo.name, githubCommit.sha);
              const commitData = githubService.convertToInsertCommit(detailedCommit, repo.id);
              await storage.createCommit(commitData);
              totalNewCommits++;
            }
          }

          // Update last sync time for repository
          await storage.updateRepository(repo.id, { lastSyncTime: new Date() });
        } catch (error) {
          errors.push(`${repo.owner}/${repo.name}: ${error}`);
        }
      }

      // Update global last sync time
      await configManager.updateLastSyncTime(new Date());

      res.json({
        success: true,
        newCommits: totalNewCommits,
        repositoriesProcessed: repositories.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      res.status(500).json({ error: `Sync failed: ${error}` });
    }
  });

  // AI Summary endpoints
  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { sinceDate } = req.body;
      const since = sinceDate ? new Date(sinceDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const commits = await storage.getCommitsSince(since);
      if (commits.length === 0) {
        return res.status(400).json({ error: "No commits found for the specified time range" });
      }

      const commitData: CommitData[] = [];
      for (const commit of commits) {
        const repository = await storage.getRepository(commit.repositoryId!);
        if (repository) {
          commitData.push({ commit, repository });
        }
      }

      const openaiService = getOpenAIService();
      const summary = await openaiService.generateDevlogSummary(commitData, {
        from: since,
        to: new Date(),
      });

      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: `Failed to generate summary: ${error}` });
    }
  });

  app.post("/api/enhance-content", async (req, res) => {
    try {
      const { content, instructions } = req.body;
      
      if (!content || !instructions) {
        return res.status(400).json({ error: "Content and instructions are required" });
      }

      const openaiService = getOpenAIService();
      const enhancedContent = await openaiService.enhanceContent(content, instructions);

      res.json({ content: enhancedContent });
    } catch (error) {
      res.status(500).json({ error: `Failed to enhance content: ${error}` });
    }
  });

  // Blog post endpoints
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(postData);
      res.json(post);
    } catch (error) {
      res.status(400).json({ error: "Invalid blog post data" });
    }
  });

  app.post("/api/publish/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      const hiveService = getHiveService();
      const result = await hiveService.publishPost({
        title: post.title,
        content: post.content,
        tags: post.tags || ['skatehive', 'development'],
        author: post.title, // Not used in HiveService, but required by interface
      });

      if (result.success) {
        // Update post status and Hive post ID
        await storage.updateBlogPost(postId, {
          status: 'published',
          publishedAt: new Date(),
          hivePostId: result.postId,
        });

        // Mark commits as processed
        if (post.commitsIncluded) {
          const commitIds = Array.isArray(post.commitsIncluded) 
            ? post.commitsIncluded.map((c: any) => c.id).filter(Boolean)
            : [];
          if (commitIds.length > 0) {
            await storage.markCommitsAsProcessed(commitIds);
          }
        }

        res.json({
          success: true,
          postUrl: result.url,
          hivePostId: result.postId,
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: `Failed to publish post: ${error}` });
    }
  });

  // Configuration endpoints
  app.get("/api/config", async (req, res) => {
    try {
      const config = await configManager.loadConfig();
      const repos = await configManager.loadRepositories();
      res.json({ config, repositories: repos });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const config = req.body.config;
      const repos = req.body.repositories;
      
      if (config) {
        await configManager.saveConfig(config);
      }
      
      if (repos) {
        await configManager.saveRepositories(repos);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const githubService = getGitHubService();
      const hiveService = getHiveService();
      
      // Test GitHub connection
      const githubValid = await githubService.validateRepository('skatehive', 'skatehive-web');
      
      // Test Hive connection
      const hiveValid = await hiveService.validatePostingKey();
      
      res.json({
        status: 'ok',
        services: {
          github: githubValid ? 'connected' : 'error',
          hive: hiveValid ? 'connected' : 'error',
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        },
      });
    } catch (error) {
      res.status(500).json({ error: `Health check failed: ${error}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
