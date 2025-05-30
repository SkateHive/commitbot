import { Octokit } from "@octokit/rest";
import type { InsertCommit } from "@shared/schema";

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getCommitsSince(owner: string, repo: string, since: Date): Promise<GitHubCommit[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since: since.toISOString(),
        per_page: 100,
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch commits: ${error}`);
    }
  }

  async getCommitDetails(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    try {
      const response = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching commit details for ${sha}:`, error);
      throw new Error(`Failed to fetch commit details: ${error}`);
    }
  }

  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  convertToInsertCommit(githubCommit: GitHubCommit, repositoryId: number): InsertCommit {
    return {
      repositoryId,
      sha: githubCommit.sha,
      message: githubCommit.commit.message,
      author: githubCommit.commit.author.name,
      authorEmail: githubCommit.commit.author.email,
      date: new Date(githubCommit.commit.author.date),
      additions: githubCommit.stats?.additions || 0,
      deletions: githubCommit.stats?.deletions || 0,
      filesChanged: githubCommit.files?.length || 0,
      url: githubCommit.html_url,
      processed: false,
    };
  }
}
