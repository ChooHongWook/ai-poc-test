"use client";

import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileOutput, CheckCircle2, Bot } from "lucide-react";
import { Badge } from "./ui/badge";

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
}

interface SingleOutputCardProps {
  title: string;
  icon: React.ReactNode;
  output: AIOutput;
  enabled: boolean;
  color: string;
}

function SingleOutputCard({ title, icon, output, enabled, color }: SingleOutputCardProps) {
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
            <Badge variant="secondary" className="ml-auto">비활성화</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
              <CheckCircle2 className="w-3 h-3 mr-1" />
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
              <div className="text-center py-12 text-muted-foreground">
                <FileOutput className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
              <div className="bg-muted p-4 rounded-lg text-center py-12 text-muted-foreground">
                결과가 없습니다
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
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
  enabledProviders 
}: OutputDataSectionProps) {
  return (
    <div className="space-y-6">
      {/* ChatGPT Output */}
      <SingleOutputCard
        title="ChatGPT"
        icon={<Bot className="w-5 h-5 text-green-600" />}
        output={chatgptOutput}
        enabled={enabledProviders.chatgpt}
        color="green"
      />

      {/* Gemini Output */}
      <SingleOutputCard
        title="Gemini"
        icon={<Bot className="w-5 h-5 text-blue-600" />}
        output={geminiOutput}
        enabled={enabledProviders.gemini}
        color="blue"
      />

      {/* Claude Output */}
      <SingleOutputCard
        title="Claude"
        icon={<Bot className="w-5 h-5 text-purple-600" />}
        output={claudeOutput}
        enabled={enabledProviders.claude}
        color="purple"
      />
    </div>
  );
}
