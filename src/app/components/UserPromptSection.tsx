'use client';

import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { MessageCircle } from 'lucide-react';

interface UserPromptSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserPromptSection({ value, onChange }: UserPromptSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          User Prompt
        </CardTitle>
        <CardDescription>
          생성하고자 하는 문서의 구체적인 요구사항을 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="user-prompt">User Prompt</Label>
          <Textarea
            id="user-prompt"
            placeholder="예: 프로젝트 제안서를 작성해주세요. 프로젝트명, 목적, 기대효과, 예산, 일정 등을 포함해야 합니다."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
          />
        </div>
      </CardContent>
    </Card>
  );
}
