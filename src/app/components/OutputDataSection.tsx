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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { FileOutput, CheckCircle2, Bot, History, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState } from 'react';
import type { HistoryItem } from '../App';

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
  history: HistoryItem[];
}

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
          <div className="text-muted-foreground py-12 text-center">
            <Bot className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>{title}가 비활성화되어 있습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-${color}-200`}>
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
              <div className="text-muted-foreground py-12 text-center">
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
                  // 크기/간격
                  'rounded-lg p-4 py-12',
                  // 색상/배경
                  'bg-muted text-muted-foreground',
                  // 레이아웃
                  'text-center',
                )}
              >
                결과가 없습니다
              </div>
            ) : (
              <pre
                className={cn(
                  // 크기/간격
                  'max-h-96 rounded-lg p-4',
                  // 색상/배경
                  'bg-muted',
                  // 레이아웃
                  'overflow-auto font-mono text-sm',
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
  history,
}: OutputDataSectionProps) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const selectedHistory = history.find((h) => h.id === selectedHistoryId);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle
            className={cn(
              // 레이아웃
              'flex items-center gap-2',
            )}
          >
            <History className="h-5 w-5" />
            생성 기록
          </CardTitle>
          <CardDescription>이전 생성 결과를 확인할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <History className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm">아직 생성 기록이 없습니다</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="history-select">기록 선택</Label>
                <Select
                  value={selectedHistoryId}
                  onValueChange={setSelectedHistoryId}
                >
                  <SelectTrigger id="history-select">
                    <SelectValue placeholder="기록을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {history.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {formatDateTime(item.timestamp)} -{' '}
                        {item.userPrompt.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHistory && (
                <div
                  className={cn(
                    // 크기/간격
                    'space-y-3 rounded-lg p-4',
                    // 색상/배경
                    'bg-muted/50 border',
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">선택된 기록</p>
                      <Dialog
                        open={detailDialogOpen}
                        onOpenChange={setDetailDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            상세 보기
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>생성 기록 상세 정보</DialogTitle>
                            <DialogDescription>
                              {formatDateTime(selectedHistory.timestamp)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* System Prompt */}
                            <div className="space-y-2">
                              <Label>System Prompt</Label>
                              <div
                                className={cn(
                                  // 크기/간격
                                  'max-h-32 rounded-md p-3',
                                  // 색상/배경
                                  'bg-muted',
                                  // 레이아웃
                                  'overflow-auto text-sm',
                                )}
                              >
                                {selectedHistory.systemPrompt || '없음'}
                              </div>
                            </div>

                            {/* User Prompt */}
                            <div className="space-y-2">
                              <Label>User Prompt</Label>
                              <div
                                className={cn(
                                  // 크기/간격
                                  'max-h-32 rounded-md p-3',
                                  // 색상/배경
                                  'bg-muted',
                                  // 레이아웃
                                  'overflow-auto text-sm',
                                )}
                              >
                                {selectedHistory.userPrompt || '없음'}
                              </div>
                            </div>

                            {/* Schema */}
                            {selectedHistory.schema && (
                              <div className="space-y-2">
                                <Label>AI 스키마</Label>
                                <pre
                                  className={cn(
                                    // 크기/간격
                                    'max-h-32 rounded-md p-3',
                                    // 색상/배경
                                    'bg-muted',
                                    // 레이아웃
                                    'overflow-auto font-mono text-sm',
                                  )}
                                >
                                  {selectedHistory.schema}
                                </pre>
                              </div>
                            )}

                            {/* Input Fields */}
                            {selectedHistory.inputFields.length > 0 && (
                              <div className="space-y-2">
                                <Label>입력 데이터</Label>
                                <div className="space-y-2">
                                  {selectedHistory.inputFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={cn(
                                        // 레이아웃
                                        'flex items-center gap-2',
                                        // 크기/간격
                                        'rounded-md p-2',
                                        // 색상/배경
                                        'bg-muted',
                                      )}
                                    >
                                      <span className="text-sm font-medium">
                                        {field.label}:
                                      </span>
                                      <span className="text-sm">
                                        {field.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* AI Outputs */}
                            <div className="space-y-3">
                              <Label>AI 출력 결과</Label>

                              {selectedHistory.chatgptOutput && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">
                                      ChatGPT
                                    </span>
                                  </div>
                                  <pre
                                    className={cn(
                                      // 크기/간격
                                      'max-h-48 rounded-md p-3',
                                      // 색상/배경
                                      'bg-muted',
                                      // 레이아웃
                                      'overflow-auto font-mono text-xs',
                                    )}
                                  >
                                    {JSON.stringify(
                                      selectedHistory.chatgptOutput.data,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              )}

                              {selectedHistory.geminiOutput && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">
                                      Gemini
                                    </span>
                                  </div>
                                  <pre
                                    className={cn(
                                      // 크기/간격
                                      'max-h-48 rounded-md p-3',
                                      // 색상/배경
                                      'bg-muted',
                                      // 레이아웃
                                      'overflow-auto font-mono text-xs',
                                    )}
                                  >
                                    {JSON.stringify(
                                      selectedHistory.geminiOutput.data,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              )}

                              {selectedHistory.claudeOutput && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">
                                      Claude
                                    </span>
                                  </div>
                                  <pre
                                    className={cn(
                                      // 크기/간격
                                      'max-h-48 rounded-md p-3',
                                      // 색상/배경
                                      'bg-muted',
                                      // 레이아웃
                                      'overflow-auto font-mono text-xs',
                                    )}
                                  >
                                    {JSON.stringify(
                                      selectedHistory.claudeOutput.data,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        생성 시간: {formatDateTime(selectedHistory.timestamp)}
                      </p>
                      <p className="text-sm">
                        User Prompt:{' '}
                        {selectedHistory.userPrompt.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
