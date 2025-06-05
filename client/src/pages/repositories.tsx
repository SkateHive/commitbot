import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/sidebar";
import type { Repository } from "@shared/schema";

export default function Repositories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRepo, setNewRepo] = useState({
    owner: "",
    name: "",
    description: "",
    isActive: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: repositories, isLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  const addRepoMutation = useMutation({
    mutationFn: (repoData: any) =>
      apiRequest("POST", "/api/repositories", repoData),
    onSuccess: async () => {
      toast({
        title: "Repository Added",
        description: "Repository has been successfully added to monitoring",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setIsAddDialogOpen(false);
      setNewRepo({ owner: "", name: "", description: "", isActive: true });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Repository",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddRepository = () => {
    if (!newRepo.owner || !newRepo.name) {
      toast({
        title: "Missing Information",
        description: "Please provide both owner and repository name",
        variant: "destructive",
      });
      return;
    }

    addRepoMutation.mutate(newRepo);
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Never";

    const now = new Date();
    const syncDate = new Date(date);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Repositories
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage GitHub repositories for commit monitoring
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <i className="fas fa-plus"></i>
                <span>Add Repository</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Owner
                    </label>
                    <Input
                      value={newRepo.owner}
                      onChange={(e) =>
                        setNewRepo({ ...newRepo, owner: e.target.value })
                      }
                      placeholder="SkateHive"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Repository Name
                    </label>
                    <Input
                      value={newRepo.name}
                      onChange={(e) =>
                        setNewRepo({ ...newRepo, name: e.target.value })
                      }
                      placeholder="skatehive3.0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={newRepo.description}
                    onChange={(e) =>
                      setNewRepo({ ...newRepo, description: e.target.value })
                    }
                    placeholder="Brief description of the repository"
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRepo.isActive}
                    onCheckedChange={(checked) =>
                      setNewRepo({ ...newRepo, isActive: checked })
                    }
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active monitoring
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddRepository}
                    disabled={addRepoMutation.isPending}
                  >
                    {addRepoMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Adding...
                      </>
                    ) : (
                      "Add Repository"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Monitored Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
                    ></div>
                  ))}
                </div>
              ) : repositories && repositories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Repository
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Sync
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {repositories.map((repo) => (
                        <tr
                          key={repo.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                <i className="fab fa-github text-gray-600 dark:text-gray-400"></i>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {repo.owner}/{repo.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {repo.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {formatTimeAgo(repo.lastSyncTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={repo.isActive ? "default" : "secondary"}
                            >
                              {repo.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() =>
                                  window.open(
                                    `https://github.com/${repo.owner}/${repo.name}`,
                                    "_blank"
                                  )
                                }
                              >
                                <i className="fas fa-external-link-alt mr-1"></i>
                                View on GitHub
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <i className="fas fa-cog mr-1"></i>
                                Settings
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fab fa-github text-2xl text-gray-500 dark:text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No repositories yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Add your first GitHub repository to start monitoring commits
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Repository
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
