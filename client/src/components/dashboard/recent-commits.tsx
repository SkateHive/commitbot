import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentCommitWithRepo } from "@shared/schema";

export default function RecentCommits() {
  const { data: commits, isLoading } = useQuery<RecentCommitWithRepo[]>({
    queryKey: ["/api/commits", { limit: 10 }],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCommitTypeIcon = (message: string) => {
    if (message.startsWith('feat')) return 'fas fa-plus text-green-600';
    if (message.startsWith('fix')) return 'fas fa-bug text-red-600';
    if (message.startsWith('docs')) return 'fas fa-file-alt text-blue-600';
    if (message.startsWith('style')) return 'fas fa-palette text-purple-600';
    return 'fas fa-code text-gray-600';
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const commitDate = new Date(date);
    const diffMs = now.getTime() - commitDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Recent Commits</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Latest activity across all repositories</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commits?.map((commit) => (
            <div key={commit.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className={getCommitTypeIcon(commit.message)}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {commit.message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {commit.repository.owner}/{commit.repository.name}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{commit.author}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(commit.date)}</span>
                  {(commit.additions || commit.deletions) && (
                    <Badge variant="outline" className="text-xs">
                      +{commit.additions || 0} -{commit.deletions || 0}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {(!commits || commits.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-code-branch text-2xl mb-2"></i>
              <p>No recent commits found</p>
              <p className="text-sm">Sync repositories to see latest activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
