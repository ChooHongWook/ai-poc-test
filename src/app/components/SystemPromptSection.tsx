import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { MessageSquare } from 'lucide-react';

interface SystemPromptSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemPromptSection({
  value,
  onChange,
}: SystemPromptSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          System Prompt
        </CardTitle>
        <CardDescription>AI의 역할과 행동 방식을 정의하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="system-prompt">System Prompt</Label>
          <Textarea
            id="system-prompt"
            placeholder="예: 당신은 전문적인 문서 작성 AI 어시스턴트입니다. 사용자가 요청한 내용을 바탕으로 정확하고 구조화된 문서를 생성해주세요."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
          />
        </div>
      </CardContent>
    </Card>
  );
}
