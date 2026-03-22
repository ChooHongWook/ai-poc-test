'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';
import type { AIOutput } from '@/lib/types';

const providerColorMap: Record<string, string> = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
};

interface AIOutputPreviewProps {
  providerName: string;
  color: string;
  output: AIOutput;
  modelName?: string;
}

export function AIOutputPreview({
  providerName,
  color,
  output,
  modelName,
}: AIOutputPreviewProps) {
  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center gap-2">
          <Bot className={cn('h-4 w-4', providerColorMap[color])} />
          <span className="text-sm font-medium">{providerName}</span>
        </div>
        {modelName && (
          <p className="text-muted-foreground text-xs">모델: {modelName}</p>
        )}
      </div>
      <CodeBlock className="max-h-48 text-xs">
        {JSON.stringify(output.data, null, 2)}
      </CodeBlock>
    </div>
  );
}
