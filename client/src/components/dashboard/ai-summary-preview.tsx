import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface AISummaryPreviewProps {
  onPreview: () => void;
  isGenerating: boolean;
}

export default function AISummaryPreview({ onPreview, isGenerating }: AISummaryPreviewProps) {
    return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 dark:text-white">Pending Summary</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-generated development summary ready for review</p>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
            <i className="fas fa-robot mr-1"></i>
            GPT-4o
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary Period</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">Last 7 days</span>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ready to Generate</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click "Generate Summary" to create an AI-powered blog post from recent commits across all monitored repositories.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              disabled={isGenerating}
            >
              <i className="fas fa-eye mr-2"></i>
              View Drafts
            </Button>
            <Button 
              onClick={onPreview}
              className="flex-1"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate Summary
                </>
              )}
            </Button>
            {/* <Button 
              onClick={handleEnhanceContent}
              className="flex-1"
              disabled={isGenerating || isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Enhancing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Enhance Content
                </>
              )}
            </Button> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
