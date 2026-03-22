'use client';

import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  FileOutput,
  CheckCircle2,
  Bot,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import {
  copyToClipboard,
  downloadJSON,
  downloadCSV,
  downloadMarkdown,
  type ExportData,
} from '@/lib/export-utils';

export interface AIOutput {
  data: Record<string, string>;
  generated: boolean;
}

interface OutputDataSectionProps {
  chatgptOutput: AIOutput;
  geminiOutput: AIOutput;
  claudeOutput: AIOutput;
  enabledProviders: {
    chatgpt: boolean;
    gemini: boolean;
    claude: boolean;
  };
  systemPrompt?: string;
  userPrompt?: string;
}

// 색상별 border 클래스 맵 (Tailwind 정적 분석을 위해 하드코딩)
const colorBorderMap: Record<string, string> = {
  green: 'border-green-200',
  blue: 'border-blue-200',
  purple: 'border-purple-200',
};

interface SingleOutputCardProps {
  title: string;
  icon: React.ReactNode;
  output: AIOutput;
  enabled: boolean;
  color: string;
}

function SingleOutputCard({
  title,
  icon,
  output,
  enabled,
  color,
}: SingleOutputCardProps) {
  const getOutputDataJSON = (data: Record<string, string>) => {
    return JSON.stringify(data, null, 2);
  };

  const outputKeys = Object.keys(output.data);

  // 해당 프로바이더의 결과를 클립보드에 복사
  const handleCopySingle = async () => {
    const success = await copyToClipboard(output.data);
    if (success) {
      toast.success(`${title} 결과가 클립보드에 복사되었습니다`);
    } else {
      toast.error('클립보드 복사에 실패했습니다');
    }
  };

  if (!enabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="secondary" className="ml-auto">
              비활성화
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              // 레이아웃 / 간격
              'py-12 text-center',
              // 색상
              'text-muted-foreground',
            )}
          >
            <Bot className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>{title}가 비활성화되어 있습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(colorBorderMap[color])}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          {output.generated && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              생성 완료
            </Badge>
          )}
          {/* 단일 프로바이더 복사 버튼 */}
          {output.generated && outputKeys.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                // 크기
                'h-7 px-2',
                // 간격
                'ml-1',
              )}
              onClick={handleCopySingle}
              title={`${title} 결과 복사`}
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              복사
            </Button>
          )}
        </CardTitle>
        <CardDescription>{title} 모델의 출력 결과</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">필드 보기</TabsTrigger>
            <TabsTrigger value="json">JSON 보기</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            {!output.generated || outputKeys.length === 0 ? (
              <div
                className={cn(
                  // 레이아웃 / 간격
                  'py-12 text-center',
                  // 색상
                  'text-muted-foreground',
                )}
              >
                <FileOutput className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>{title} 결과를 기다리는 중입니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outputKeys.map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`output-${title}-${key}`}>{key}</Label>
                    <Input
                      id={`output-${title}-${key}`}
                      value={output.data[key]}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="json">
            {!output.generated || outputKeys.length === 0 ? (
              <div
                className={cn(
                  // 색상 / 배경
                  'bg-muted rounded-lg',
                  // 레이아웃 / 간격
                  'p-4 py-12 text-center',
                  // 색상
                  'text-muted-foreground',
                )}
              >
                결과가 없습니다
              </div>
            ) : (
              <pre
                className={cn(
                  // 색상 / 배경
                  'bg-muted rounded-lg',
                  // 레이아웃 / 크기
                  'max-h-96 overflow-auto p-4',
                  // 타이포그래피
                  'font-mono text-sm',
                )}
              >
                {getOutputDataJSON(output.data)}
              </pre>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function OutputDataSection({
  chatgptOutput,
  geminiOutput,
  claudeOutput,
  enabledProviders,
  systemPrompt,
  userPrompt,
}: OutputDataSectionProps) {
  // 하나라도 생성된 결과가 있는지 확인
  const hasAnyOutput =
    (enabledProviders.chatgpt &&
      chatgptOutput.generated &&
      Object.keys(chatgptOutput.data).length > 0) ||
    (enabledProviders.gemini &&
      geminiOutput.generated &&
      Object.keys(geminiOutput.data).length > 0) ||
    (enabledProviders.claude &&
      claudeOutput.generated &&
      Object.keys(claudeOutput.data).length > 0);

  // ExportData 빌드 헬퍼
  const buildExportData = (): ExportData => {
    const exportData: ExportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        systemPrompt,
        userPrompt,
      },
    };

    if (
      enabledProviders.chatgpt &&
      chatgptOutput.generated &&
      Object.keys(chatgptOutput.data).length > 0
    ) {
      exportData.chatgpt = chatgptOutput.data;
    }
    if (
      enabledProviders.gemini &&
      geminiOutput.generated &&
      Object.keys(geminiOutput.data).length > 0
    ) {
      exportData.gemini = geminiOutput.data;
    }
    if (
      enabledProviders.claude &&
      claudeOutput.generated &&
      Object.keys(claudeOutput.data).length > 0
    ) {
      exportData.claude = claudeOutput.data;
    }

    return exportData;
  };

  // 전체 JSON 클립보드 복사
  const handleCopyAll = async () => {
    const exportData = buildExportData();
    const success = await copyToClipboard(exportData);
    if (success) {
      toast.success('전체 결과가 클립보드에 복사되었습니다');
    } else {
      toast.error('클립보드 복사에 실패했습니다');
    }
  };

  // JSON 다운로드
  const handleDownloadJSON = () => {
    downloadJSON(buildExportData());
    toast.success('JSON 파일이 다운로드되었습니다');
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    downloadCSV(buildExportData());
    toast.success('CSV 파일이 다운로드되었습니다');
  };

  // 마크다운 다운로드
  const handleDownloadMarkdown = () => {
    downloadMarkdown(buildExportData());
    toast.success('마크다운 파일이 다운로드되었습니다');
  };

  return (
    <div className="space-y-6">
      {/* 내보내기 액션 바 */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          disabled={!hasAnyOutput}
        >
          <Copy className="mr-1 h-4 w-4" />
          전체 JSON 복사
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!hasAnyOutput}>
              <Download className="mr-1 h-4 w-4" />
              다운로드
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadJSON}>
              <FileJson className="mr-2 h-4 w-4" />
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadMarkdown}>
              <FileText className="mr-2 h-4 w-4" />
              마크다운
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ChatGPT Output */}
      <SingleOutputCard
        title="ChatGPT"
        icon={<Bot className="h-5 w-5 text-green-600" />}
        output={chatgptOutput}
        enabled={enabledProviders.chatgpt}
        color="green"
      />

      {/* Gemini Output */}
      <SingleOutputCard
        title="Gemini"
        icon={<Bot className="h-5 w-5 text-blue-600" />}
        output={geminiOutput}
        enabled={enabledProviders.gemini}
        color="blue"
      />

      {/* Claude Output */}
      <SingleOutputCard
        title="Claude"
        icon={<Bot className="h-5 w-5 text-purple-600" />}
        output={claudeOutput}
        enabled={enabledProviders.claude}
        color="purple"
      />
    </div>
  );
}
