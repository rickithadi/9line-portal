'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Settings, MessageSquare, X, Zap } from 'lucide-react';

interface MCPChatProps {
  externalUserId: string;
  onClose?: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'system';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
}

interface MCPResponse {
  response: string;
  finishReason: string;
  toolCalls: Array<{
    toolName: string;
    input: any;
  }>;
  toolResults: Array<{
    output: any;
  }>;
}

const MCPChat: React.FC<MCPChatProps> = ({
  externalUserId,
  onClose,
  className = ""
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load available tools on mount
    loadAvailableTools();
    
    // Add welcome message
    addMessage({
      type: 'system',
      content: 'Welcome to MCP Chat! I can help you interact with your connected services using AI. Try asking me to perform tasks with your connected apps.',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const loadAvailableTools = async () => {
    try {
      const response = await fetch(`/api/mcp/tools?externalUserId=${encodeURIComponent(externalUserId)}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableTools(data.tools || []);
      } else {
        console.error('Failed to load tools:', data.error);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    
    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    try {
      const response = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          externalUserId,
          // Include conversation history for context
          conversationHistory: messages
            .filter(msg => msg.type === 'user' || msg.type === 'assistant')
            .map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content,
            })),
        }),
      });

      const data: MCPResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.response || 'Failed to process message');
      }

      // Add assistant response
      addMessage({
        type: 'assistant',
        content: data.response,
      });

      // Add tool calls if any
      if (data.toolCalls && data.toolCalls.length > 0) {
        data.toolCalls.forEach((toolCall, index) => {
          addMessage({
            type: 'tool_call',
            content: `Called ${toolCall.toolName}`,
            toolName: toolCall.toolName,
            toolInput: toolCall.input,
          });
        });
      }

      // Add tool results if any
      if (data.toolResults && data.toolResults.length > 0) {
        data.toolResults.forEach((result, index) => {
          addMessage({
            type: 'tool_result',
            content: 'Tool execution completed',
            toolOutput: result.output,
          });
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      addMessage({
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'An error occurred'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    const isToolCall = message.type === 'tool_call';
    const isToolResult = message.type === 'tool_result';

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm max-w-xs text-center">
            {message.content}
          </div>
        </div>
      );
    }

    if (isToolCall) {
      return (
        <div key={message.id} className="flex justify-center mb-2">
          <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{message.content}</span>
            {message.toolInput && (
              <details className="ml-2">
                <summary className="cursor-pointer text-xs">Input</summary>
                <pre className="text-xs mt-1 bg-purple-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(message.toolInput, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    if (isToolResult) {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <span>{message.content}</span>
            {message.toolOutput && (
              <details className="ml-2">
                <summary className="cursor-pointer text-xs">Output</summary>
                <pre className="text-xs mt-1 bg-green-100 p-2 rounded overflow-x-auto max-w-md">
                  {JSON.stringify(message.toolOutput, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-blue-500' : 'bg-gray-500'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          <div>
            <div className={`px-4 py-2 rounded-lg ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white border rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">MCP Chat</h3>
          <span className="text-sm text-gray-500">({availableTools.length} tools)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTools(!showTools)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Available tools"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tools Panel */}
      {showTools && (
        <div className="p-4 border-b bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Available Tools ({availableTools.length})</h4>
          {availableTools.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {availableTools.map((tool, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {tool}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tools available. Make sure you have connected services.</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to help with your connected services..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default MCPChat;