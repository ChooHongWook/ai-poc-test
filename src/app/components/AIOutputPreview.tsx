import { Bot } from 'lucide-react';
import { cn } from './ui/utils';
import { CodeBlock } from './ui/code-block';
import type { AIOutput } from './OutputDataSection';

const providerColorMap: Record<string, string> = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
};

interface AIOutputPreviewProps {
  providerName: string;
  color: string;
  output: AIOutput;
}

export function AIOutputPreview({
  providerName,
  color,
  output,
}: AIOutputPreviewProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bot className={cn('h-4 w-4', providerColorMap[color])} />
        <span className="text-sm font-medium">{providerName}</span>
      </div>
      <CodeBlock className="max-h-48 text-xs">
        {JSON.stringify(output.data, null, 2)}
      </CodeBlock>
    </div>
  );
}
