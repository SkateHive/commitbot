import fs from 'fs/promises';
import path from 'path';
import type { Repository } from '@shared/schema';

export interface BotConfigData {
  hiveUsername: string;
  syncInterval: number; // hours
  autoPublish: boolean;
  lastSyncTime?: string;
  aiModel: string;
  maxTokensPerSummary: number;
}

export interface RepositoryConfig {
  owner: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export class ConfigManager {
  private configPath: string;
  private reposPath: string;

  constructor() {
    this.configPath = path.resolve(process.cwd(), 'config.json');
    this.reposPath = path.resolve(process.cwd(), 'repos.json');
  }

  async loadConfig(): Promise<BotConfigData> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.log('Config file not found, using defaults');
      return this.getDefaultConfig();
    }
  }

  async saveConfig(config: BotConfigData): Promise<void> {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  async loadRepositories(): Promise<RepositoryConfig[]> {
    try {
      const data = await fs.readFile(this.reposPath, 'utf-8');
      console.log('Loaded raw data:', data); // 👈 check what’s in the file
      const parsed = JSON.parse(data);
      console.log('Parsed:', parsed);
      return parsed;
    } catch (error) {
      console.log('Repos file not found, using defaults');
      return this.getDefaultRepositories();
    }
  }

  async saveRepositories(repos: RepositoryConfig[]): Promise<void> {
    try {
      await fs.writeFile(this.reposPath, JSON.stringify(repos, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving repositories:', error);
      throw new Error(`Failed to save repositories: ${error}`);
    }
  }

  async updateLastSyncTime(timestamp: Date): Promise<void> {
    const config = await this.loadConfig();
    config.lastSyncTime = timestamp.toISOString();
    await this.saveConfig(config);
  }

  private getDefaultConfig(): BotConfigData {
    return {
      hiveUsername: process.env.HIVE_USERNAME || 'skatehive.dev',
      syncInterval: 6, // 6 hours
      autoPublish: false,
      aiModel: 'gpt-4o',
      maxTokensPerSummary: 2000,
    };
  }

  private getDefaultRepositories(): RepositoryConfig[] {
    return [
      {
        owner: 'skatehive',
        name: 'skatehive-web',
        description: 'Main web application',
        isActive: true,
      },
      {
        owner: 'skatehive',
        name: 'skatehive-api',
        description: 'Backend API services',
        isActive: true,
      },
      {
        owner: 'gnars-dao',
        name: 'gnars-frontend',
        description: 'Gnars DAO interface',
        isActive: true,
      },
    ];
  }
}
