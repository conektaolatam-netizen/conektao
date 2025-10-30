import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain } from 'lucide-react';

interface Message {
  type: 'ai' | 'user';
  message: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversation: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  variant?: 'light' | 'dark';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversation, 
  isTyping, 
  messagesEndRef,
  variant = 'light'
}) => {
  return (
    <div className={`h-96 overflow-y-auto mb-6 space-y-4 p-6 rounded-2xl max-w-full ${variant === 'dark' ? 'bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))]' : 'bg-gradient-to-b from-blue-50/50 to-white border border-blue-100'}`}>
      {conversation.map((msg, index) => (
        <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
          <div className={`max-w-[85%] break-words ${
            msg.type === 'user' 
              ? 'bg-gradient-primary text-white rounded-3xl rounded-br-lg shadow-lg' 
              : `${variant === 'dark' 
                  ? 'bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))] text-[hsl(var(--ai-foreground))]'
                  : 'bg-white border-2 border-blue-100 text-gray-800'
                } rounded-3xl rounded-bl-lg shadow-md`
          } p-5`}>
            {msg.type === 'ai' && (
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center mr-3">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-primary">IA Conektao</span>
                <Badge className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0">
                  <Brain className="h-3 w-3 mr-1" />
                  Inteligente
                </Badge>
              </div>
            )}
            <div className={`whitespace-pre-line leading-relaxed break-words ${msg.type === 'user' ? 'text-white font-medium' : variant === 'dark' ? 'text-[hsl(var(--ai-foreground))]' : 'text-gray-800'}`}>
              {msg.message}
            </div>
            <p className={`text-xs mt-3 ${msg.type === 'user' ? 'text-white/70' : variant === 'dark' ? 'text-[hsl(var(--muted-foreground))]' : 'text-gray-500'}`}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start animate-fade-in">
          <div className={`${variant === 'dark' ? 'bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))]' : 'bg-white border-2 border-blue-100'} rounded-3xl rounded-bl-lg shadow-md p-5 max-w-[85%]`}>
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center mr-3">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <span className={`text-sm font-semibold ${variant === 'dark' ? 'text-[hsl(var(--ai-foreground))]' : 'text-primary'}`}>IA Conektao está pensando...</span>
            </div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};