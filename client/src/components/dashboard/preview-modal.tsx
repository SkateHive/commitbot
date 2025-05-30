import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AISummaryResponse } from "@shared/schema";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AISummaryResponse | null;
}

export default function PreviewModal({ isOpen, onClose, summary }: PreviewModalProps) {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update local state when summary changes
  useEffect(() => {
    if (summary) {
      setEditedTitle(summary.title);
      setEditedContent(summary.content);
      setEditedTags(summary.tags.join(", "));
    }
  }, [summary]);

  const createPostMutation = useMutation({
    mutationFn: (postData: any) => apiRequest("POST", "/api/blog-posts", postData),
    onSuccess: async (response) => {
      const post = await response.json();
      toast({
        title: "Draft Saved",
        description: "Blog post saved as draft successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      return post;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (postData: any) => {
      const createResponse = await apiRequest("POST", "/api/blog-posts", postData);
      const post = await createResponse.json();
      return apiRequest("POST", `/api/publish/${post.id}`);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Published Successfully!",
        description: `Post published to Hive blockchain: ${result.postUrl}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Publishing Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const postData = {
      title: editedTitle,
      content: editedContent,
      summary: summary?.summary || "",
      tags: editedTags.split(",").map(tag => tag.trim()).filter(Boolean),
      status: "draft",
      aiTokensUsed: summary?.tokensUsed || 0,
    };

    createPostMutation.mutate(postData);
  };

  const handlePublish = () => {
    const postData = {
      title: editedTitle,
      content: editedContent,
      summary: summary?.summary || "",
      tags: editedTags.split(",").map(tag => tag.trim()).filter(Boolean),
      status: "published",
      aiTokensUsed: summary?.tokensUsed || 0,
    };

    publishMutation.mutate(postData);
  };

  if (!summary) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Blog Post Preview</span>
            <Badge variant="outline">
              <i className="fas fa-brain mr-1"></i>
              {summary.tokensUsed} tokens used
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Editor Panel */}
          <div className="w-1/2 flex flex-col space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Title</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Post title..."
                className="font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tags</label>
              <Input
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="skatehive, development, web3"
                className="font-mono text-sm"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Content (Markdown)</label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Blog post content in markdown..."
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Live Preview</label>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto bg-white dark:bg-gray-800">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h1 className="text-xl font-bold mb-4">{editedTitle}</h1>
                <div className="mb-4">
                  {editedTags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                    <Badge key={tag} variant="secondary" className="mr-2 mb-2">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div 
                  className="prose-content"
                  dangerouslySetInnerHTML={{ 
                    __html: editedContent
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^#{1}\s+(.*$)/gim, '<h1>$1</h1>')
                      .replace(/^#{2}\s+(.*$)/gim, '<h2>$1</h2>')
                      .replace(/^#{3}\s+(.*$)/gim, '<h3>$1</h3>')
                      .replace(/^-\s+(.*$)/gim, '<ul><li>$1</li></ul>')
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Word count: {editedContent.split(/\s+/).length}</span>
            <span>Estimated read time: {Math.ceil(editedContent.split(/\s+/).length / 200)} min</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Draft
                </>
              )}
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {publishMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Publishing...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Publish to Hive
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
