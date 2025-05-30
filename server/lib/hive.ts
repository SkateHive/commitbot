import { Client, PrivateKey } from '@hiveio/dhive';

export interface HivePostData {
  title: string;
  content: string;
  tags: string[];
  author: string;
}

export interface HivePostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export class HiveService {
  private client: Client;
  private privateKey: PrivateKey;
  private username: string;

  constructor(postingKey: string, username: string, apiUrl = 'https://api.hive.blog') {
    this.client = new Client([apiUrl]);
    this.privateKey = PrivateKey.fromString(postingKey);
    this.username = username;
  }

  async publishPost(postData: HivePostData): Promise<HivePostResult> {
    try {
      const permlink = this.generatePermlink(postData.title);
      
      const commentOp = [
        'comment',
        {
          parent_author: '',
          parent_permlink: postData.tags[0] || 'skatehive',
          author: this.username,
          permlink: permlink,
          title: postData.title,
          body: postData.content,
          json_metadata: JSON.stringify({
            tags: postData.tags,
            app: 'skatehive-devbot/1.0.0',
            format: 'markdown',
          }),
        },
      ];

      const commentOptionsOp = [
        'comment_options',
        {
          author: this.username,
          permlink: permlink,
          max_accepted_payout: '1000000.000 HBD',
          percent_hbd: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [
            [0, {
              beneficiaries: [
                { account: 'skatehive', weight: 500 }, // 5% to skatehive
              ],
            }],
          ],
        },
      ];

      const operations = [commentOp, commentOptionsOp];
      
      const result = await this.client.broadcast.sendOperations(operations, this.privateKey);
      
      return {
        success: true,
        postId: result.id,
        url: `https://hive.blog/@${this.username}/${permlink}`,
      };
    } catch (error) {
      console.error('Error publishing to Hive:', error);
      return {
        success: false,
        error: `Failed to publish to Hive: ${error}`,
      };
    }
  }

  async getAccount(username: string): Promise<any> {
    try {
      const accounts = await this.client.database.getAccounts([username]);
      return accounts[0] || null;
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  }

  async getPost(author: string, permlink: string): Promise<any> {
    try {
      return await this.client.database.call('get_content', [author, permlink]);
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  private generatePermlink(title: string): string {
    const timestamp = Date.now();
    
    // More aggressive cleaning for Hive permalinks
    const slug = title
      .toLowerCase() // Convert to lowercase
      .normalize('NFD') // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except spaces and hyphens
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .substring(0, 35); // Shorter length to accommodate timestamp
    
    // Fallback if slug is empty after cleaning
    const finalSlug = slug || 'devlog-update';
    
    const permlink = `${finalSlug}-${timestamp}`;
    
    // Final validation - ensure only lowercase letters, numbers, and hyphens
    const validatedPermlink = permlink.replace(/[^a-z0-9-]/g, '');
    
    console.log(`Generated permlink: "${title}" -> "${validatedPermlink}"`);
    
    return validatedPermlink;
  }

  async validatePostingKey(): Promise<boolean> {
    try {
      const account = await this.getAccount(this.username);
      if (!account) return false;

      const publicKey = this.privateKey.createPublic();
      const postingAuthority = account.posting;
      
      return postingAuthority.key_auths.some(([key]: [string, number]) => key === publicKey.toString());
    } catch (error) {
      console.error('Error validating posting key:', error);
      return false;
    }
  }
}
