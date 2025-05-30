import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import RepositoryStatus from "@/components/dashboard/repository-status";
import RecentCommits from "@/components/dashboard/recent-commits";
import AISummaryPreview from "@/components/dashboard/ai-summary-preview";
import PreviewModal from "@/components/dashboard/preview-modal";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync"),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Sync Complete",
        description: `Found ${result.newCommits} new commits across ${result.repositoriesProcessed} repositories`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: (data: { sinceDate?: string }) => 
      apiRequest("POST", "/api/generate-summary", data),
    onSuccess: async (response) => {
      const summary = await response.json();
      setPendingSummary(summary);
      setIsPreviewOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Summary Generation Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleGenerateSummary = () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    generateSummaryMutation.mutate({ sinceDate: lastWeek.toISOString() });
  };

  const lastSyncTime = config?.config?.lastSyncTime 
    ? new Date(config.config.lastSyncTime).toLocaleString()
    : "Never";

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and manage your development activity</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last checked: <span className="font-mono">{lastSyncTime}</span>
            </span>
            <Button 
              onClick={handleSync} 
              disabled={syncMutation.isPending}
              className="flex items-center space-x-2"
            >
              <i className={`fas fa-sync-alt ${syncMutation.isPending ? 'animate-spin' : ''}`}></i>
              <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentCommits />
            <AISummaryPreview 
              onPreview={handleGenerateSummary}
              isGenerating={generateSummaryMutation.isPending}
            />
          </div>
          
          <RepositoryStatus />
        </div>
      </main>

      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        summary={pendingSummary}
      />
    </div>
  );
}
