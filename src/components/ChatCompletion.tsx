import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/ApiContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DEFAULT_MODEL, SUPPORTED_MODELS, isSupportedModel } from '@/config/models';
import type { UnrealModelId } from '@/config/models';
import { OPENAI_URL } from '@/config/unreal';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type ApiModelLike = {
  id?: unknown;
  model?: unknown;
  name?: unknown;
} | string | null | undefined;

const extractModelId = (m: ApiModelLike): string | undefined => {
  if (typeof m === 'string') return m;
  if (m && typeof m === 'object') {
    const obj = m as { id?: unknown; model?: unknown; name?: unknown };
    const candidate = [obj.id, obj.model, obj.name].find(
      (v): v is string => typeof v === 'string'
    );
    return candidate;
  }
  return undefined;
};

const ChatCompletion: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, apiKey } = useApi();
  const [model, setModel] = useState<UnrealModelId>(DEFAULT_MODEL);
  const [availableModels, setAvailableModels] = useState<UnrealModelId[]>([...SUPPORTED_MODELS]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Dynamically fetch models from API (filtered to the supported allowlist)
  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) return;
      setIsLoadingModels(true);
      try {
        const response = await fetch(`${OPENAI_URL}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          credentials: 'include',
        });
        if (!response.ok) {
          // Silently fallback to static list
          return;
        }
        const data: unknown = await response.json();
        let ids: string[] = [];
        if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)) {
          ids = ((data as Record<string, unknown>).data as unknown[])
            .map((m) => extractModelId(m as ApiModelLike))
            .filter((v): v is string => Boolean(v));
        } else if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).models)) {
          ids = ((data as Record<string, unknown>).models as unknown[])
            .map((m) => extractModelId(m as ApiModelLike))
            .filter((v): v is string => Boolean(v));
        } else if (Array.isArray(data)) {
          ids = (data as unknown[])
            .map((m) => extractModelId(m as ApiModelLike))
            .filter((v): v is string => Boolean(v));
        }

        const filtered = ids.filter(isSupportedModel) as UnrealModelId[];
        if (filtered.length > 0) {
          setAvailableModels(filtered);
          setModel((prev) => (filtered.includes(prev) ? prev : filtered[0] ?? DEFAULT_MODEL));
        }
      } catch (err) {
        // Fallback to the static SUPPORTED_MODELS list on any error
        console.warn('Failed to fetch models, using static list', err);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    if (!isAuthenticated || !apiKey) {
      setError('You need to connect your wallet and generate an API key first.');
      return;
    }

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${OPENAI_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        credentials: 'include',
        body: JSON.stringify({
          model: model,
          messages: [...messages, userMessage],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get a response');
      }

      const data = await response.json();
      const assistantMessage: Message = data.choices[0].message;
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
      setError(errorMessage);
      console.error('Chat completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Chat Completion API Demo</CardTitle>
        <CardDescription>
          Test your API key with the chat completion endpoint
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500 bg-red-500/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-1">Model</div>
          <Select value={model} onValueChange={(v) => setModel(v as UnrealModelId)}>
            <SelectTrigger className="w-full" disabled={isLoadingModels || availableModels.length === 0}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 ml-8' 
                  : 'bg-gray-100 dark:bg-gray-800 mr-8'
              }`}
            >
              <p className="text-xs font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <Textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="resize-none min-h-[100px]"
            disabled={isLoading || !isAuthenticated}
          />
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim() || !isAuthenticated}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Send
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatCompletion;
