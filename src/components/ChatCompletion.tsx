import React, { useState } from 'react';
import { useApi } from '@/lib/ApiContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ChatCompletion: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, apiKey } = useApi();

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
      const response = await fetch('https://openai.unreal.art/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'unreal-gpt-3.5-turbo',
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
