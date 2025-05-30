import OpenAI from "openai";
import type { AISummaryResponse, Commit, Repository } from "@shared/schema";

export interface CommitData {
  commit: Commit;
  repository: Repository;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateDevlogSummary(commits: CommitData[], timeRange: { from: Date; to: Date }): Promise<AISummaryResponse> {
    const commitsByRepo = this.groupCommitsByRepository(commits);
    const prompt = this.buildPrompt(commitsByRepo, timeRange);

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a technical writer specializing in development summaries for the Skatehive and Gnars communities. 
            Generate engaging blog posts that highlight development progress in a way that's accessible to both technical and non-technical community members.
            Always respond with valid JSON containing title, content, summary, tags, and tokensUsed fields.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        title: result.title || "Development Update",
        content: result.content || "",
        summary: result.summary || "",
        tags: result.tags || ["skatehive", "development", "web3"],
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("Error generating AI summary:", error);
      throw new Error(`Failed to generate AI summary: ${error}`);
    }
  }

  private groupCommitsByRepository(commits: CommitData[]): Record<string, CommitData[]> {
    return commits.reduce((acc, commitData) => {
      const repoName = `${commitData.repository.owner}/${commitData.repository.name}`;
      if (!acc[repoName]) {
        acc[repoName] = [];
      }
      acc[repoName].push(commitData);
      return acc;
    }, {} as Record<string, CommitData[]>);
  }

  private buildPrompt(commitsByRepo: Record<string, CommitData[]>, timeRange: { from: Date; to: Date }): string {
    const fromDate = timeRange.from.toLocaleDateString();
    const toDate = timeRange.to.toLocaleDateString();
    
    // Determine project context from repository names
    const repoNames = Object.keys(commitsByRepo);
    const projectContext = this.determineProjectContext(repoNames);
    
    let prompt = `Generate a development blog post covering recent development activity from ${fromDate} to ${toDate}.\n\n`;
    
    prompt += "Repository activity:\n\n";
    
    Object.entries(commitsByRepo).forEach(([repoName, commits]) => {
      prompt += `**${repoName}** (${commits.length} commits):\n`;
      commits.forEach(({ commit }) => {
        prompt += `- ${commit.message} by ${commit.author}\n`;
        if (commit.additions || commit.deletions) {
          prompt += `  (+${commit.additions || 0}/-${commit.deletions || 0} lines)\n`;
        }
      });
      prompt += "\n";
    });

    prompt += `
${projectContext}

Please generate a JSON response with the following structure:
{
  "title": "Engaging title for the blog post that reflects the project theme",
  "content": "Full markdown blog post content (800-1200 words) that includes:
    - Introduction highlighting the development period
    - Organized sections by repository or feature type
    - Technical details explained in accessible language
    - User impact and benefits
    - Bullet points and emojis for readability
    - Call to action for community engagement",
  "summary": "Brief 2-3 sentence summary of key developments",
  "tags": ["relevant", "tags", "for", "the", "project"],
  "tokensUsed": 0
}

Focus on:
- Project-appropriate tone and terminology
- Community building aspects
- Technical achievements made accessible
- Future roadmap hints
- Contributor recognition`;

    return prompt;
  }

  private determineProjectContext(repoNames: string[]): string {
    const allRepos = repoNames.join(' ').toLowerCase();
    
    if (allRepos.includes('skate') || allRepos.includes('gnars')) {
      return `Project Context: This appears to be skateboarding/action sports related software. Use skateboarding metaphors and terminology where appropriate. Include skateboard emoji 🛹 in the title. Focus on skateboarding and web3 culture.`;
    } else if (allRepos.includes('nounspace') || allRepos.includes('noun')) {
      return `Project Context: This appears to be web3/DAO related software. Use appropriate blockchain and decentralized technology terminology. Focus on decentralization, community governance, and web3 innovation.`;
    } else if (allRepos.includes('terminal') || allRepos.includes('cli')) {
      return `Project Context: This appears to be command-line/developer tooling software. Use appropriate developer tooling terminology. Focus on developer experience and productivity improvements.`;
    } else {
      return `Project Context: Analyze the repository names and commit messages to determine the appropriate domain, tone, and terminology for this project. Use relevant emojis and metaphors that match the project's purpose and target audience.`;
    }
  }

  async enhanceContent(content: string, instructions: string): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a technical writer helping to improve blog post content based on user feedback."
          },
          {
            role: "user",
            content: `Please enhance this blog post content according to these instructions: "${instructions}"\n\nOriginal content:\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0].message.content || content;
    } catch (error) {
      console.error("Error enhancing content:", error);
      throw new Error(`Failed to enhance content: ${error}`);
    }
  }
}
