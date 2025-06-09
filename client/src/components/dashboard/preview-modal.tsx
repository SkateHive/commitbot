import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AISummaryResponse } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AISummaryResponse | null;
}

export default function PreviewModal({
  isOpen,
  onClose,
  summary,
}: PreviewModalProps) {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Update local state when summary changes
  useEffect(() => {
    if (summary) {
      setEditedTitle(summary.title);
      setEditedContent(summary.content);
      setEditedTags(summary.tags.join(", "));
    }
  }, [summary]);

  const createPostMutation = useMutation({
    mutationFn: (postData: any) =>
      apiRequest("POST", "/api/blog-posts", postData),
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
      const createResponse = await apiRequest(
        "POST",
        "/api/blog-posts",
        postData
      );
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
      tags: editedTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
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
      tags: editedTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: "published",
      aiTokensUsed: summary?.tokensUsed || 0,
    };

    publishMutation.mutate(postData);
  };

  // Add paste handler for image clipboard
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const formData = new FormData();
          formData.append("file", file);
          try {
            const res = await fetch("/api/pinata-upload", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (!res.ok || !data.IpfsHash) {
              toast({
                title: "Image upload failed",
                description: data.error || "Unknown error",
                variant: "destructive",
              });
              return;
            }
            const imageUrl = `https://ipfs.skatehive.app/ipfs/${data.IpfsHash}`;
            const markdown = `![](${imageUrl})`;
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const before = editedContent.slice(0, start);
              const after = editedContent.slice(end);
              setEditedContent(before + markdown + after);
              setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd =
                  start + markdown.length;
              }, 0);
            } else {
              setEditedContent(editedContent + "\n" + markdown);
            }
          } catch (err: any) {
            toast({
              title: "Image upload failed",
              description: err.message,
              variant: "destructive",
            });
          }
          break;
        }
      }
    };
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("paste", handlePaste as any);
    }
    return () => {
      if (textarea) {
        textarea.removeEventListener("paste", handlePaste as any);
      }
    };
  }, [editedContent, toast]);

  if (!summary) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-[90vh] overflow-hidden flex flex-col">
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Title
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Post title..."
                className="font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tags
              </label>
              <Input
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="skatehive, development, web3"
                className="font-mono text-sm"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Content (Markdown)
              </label>
              {/* Markdown Editor Toolbar */}
              <div className="flex items-center mb-2 space-x-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Insert Image"
                  onClick={() => {
                    document.getElementById("image-upload-input")?.click();
                  }}
                >
                  {/* Inline SVG for image icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h12v6.586l-3.293-3.293a1 1 0 0 0-1.414 0L7 13l-2-2L4 12.586V5zm0 10v-1.414l3-3 4 4 3-3L18 15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                  </svg>
                </button>
                {/* Add more toolbar buttons here if needed */}
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/pinata-upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok || !data.IpfsHash) {
                        toast({
                          title: "Image upload failed",
                          description: data.error || "Unknown error",
                          variant: "destructive",
                        });
                        return;
                      }
                      const imageUrl = `https://ipfs.skatehive.app/ipfs/${data.IpfsHash}`;
                      const markdown = `![](${imageUrl})`;
                      // Insert at cursor position
                      if (textareaRef.current) {
                        const textarea = textareaRef.current;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const before = editedContent.slice(0, start);
                        const after = editedContent.slice(end);
                        setEditedContent(before + markdown + after);
                        // Move cursor after inserted markdown
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = textarea.selectionEnd =
                            start + markdown.length;
                        }, 0);
                      } else {
                        setEditedContent(editedContent + "\n" + markdown);
                      }
                    } catch (err: any) {
                      toast({
                        title: "Image upload failed",
                        description: err.message,
                        variant: "destructive",
                      });
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </div>
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Blog post content in markdown..."
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Live Preview
            </label>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto bg-white dark:bg-gray-800">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h1 className="text-xl font-bold mb-4">{editedTitle}</h1>
                <div className="mb-4">
                  {editedTags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="mr-2 mb-2"
                      >
                        #{tag}
                      </Badge>
                    ))}
                </div>
                <div className="prose-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {editedContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Word count: {editedContent.split(/\s+/).length}</span>
            <span>
              Estimated read time:{" "}
              {Math.ceil(editedContent.split(/\s+/).length / 200)} min
            </span>
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
