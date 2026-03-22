"use client";

import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Code, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { cn } from "./ui/utils";

interface SchemaSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SchemaSection({ value, onChange }: SchemaSectionProps) {
  const isValidJSON = () => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          AI 스키마
        </CardTitle>
        <CardDescription>출력 데이터의 구조를 JSON 스키마로 정의하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="schema">JSON Schema</Label>
          <Textarea
            id="schema"
            placeholder={`{\n  "type": "object",\n  "properties": {\n    "title": { "type": "string" },\n    "content": { "type": "string" },\n    "summary": { "type": "string" }\n  }\n}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className={cn(
              // 타이포그래피
              "font-mono text-sm",
            )}
          />
        </div>

        {value && !isValidJSON() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              유효하지 않은 JSON 형식입니다. 구문을 확인해주세요.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
