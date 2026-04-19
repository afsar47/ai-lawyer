'use client';

import { useState, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Sparkles,
  MessageSquare,
  Brain,
  Zap
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import FormattedAIResult from '../components/FormattedAIResult';
import { aiService } from '../../lib/ai-service';
import { aiConfigManager } from '../../lib/ai-config';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import { buildLegalAssistantPrompt, ensureLegalDisclaimer, type Jurisdiction } from '../../lib/legal/prompt';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { t, translationsLoaded } = useTranslations();
  const { settings } = useSettings();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add welcome message when translations are loaded
  useEffect(() => {
    if (translationsLoaded && messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: t('ai.assistant.welcomeMessage'),
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [translationsLoaded, t, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the active AI model
      const activeModel = await aiConfigManager.getActiveModel();
      
      // Note: Matter-aware context is handled in dedicated tools (Drafting/Review).
      // The assistant chat stays general-purpose and safe by default.
      const contextData = '';
      
      // Build enhanced prompt with context
      const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;
      const enhancedPrompt = buildLegalAssistantPrompt({
        userMessage: currentInput,
        jurisdiction,
        contextData: contextData ? `Use the following information from the database when relevant:\n${contextData}` : undefined,
      });
      
      // Call the real AI service
      const result = await aiService.generateText({
        prompt: enhancedPrompt,
        modelId: activeModel?.id || '1',
        maxTokens: 800,
        temperature: 0.7
      });

      if (result.success && result.content) {
        const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;
        const finalText = ensureLegalDisclaimer(result.content, jurisdiction);

        // Persist result for audit/history (non-blocking)
        try {
          const activeModel = await aiConfigManager.getActiveModel();
          const userId = String(session?.user?.id || session?.user?.email || 'unknown');
          await fetch('/api/ai-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              type: 'legal-assistant',
              title: `AI Assistant — ${currentInput.slice(0, 60)}`,
              content: finalText,
              aiModel: activeModel
                ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
                : undefined,
              metadata: {
                jurisdiction,
                tool: 'assistant_chat',
              },
            }),
          });
        } catch {
          // ignore
        }

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: finalText,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback response if AI service fails
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: t('ai.assistant.fallbackResponse'),
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Error response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: t('ai.assistant.errorResponse'),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };



  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('ai.assistant.loadingTranslations')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('ai.assistant.title')} 
        description={t('ai.assistant.description')}
      >
        {/* AI Assistant Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('ai.assistant.headerTitle')}</h2>
              <p className="text-blue-100">{t('ai.assistant.headerDescription')}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm">{t('ai.assistant.symptomAnalysis')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-300" />
              <span className="text-sm">{t('ai.assistant.treatmentSuggestions')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-300" />
              <span className="text-sm">{t('ai.assistant.medicalResearch')}</span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('ai.assistant.chatTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('ai.assistant.chatStatus')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">{t('ai.assistant.active')}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.sender === 'ai' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {message.sender === 'ai' ? (
                        <div className="space-y-2">
                          <div className="text-sm leading-relaxed">
                            {message.content.split('\n').map((line, idx) => {
                              const trimmed = line.trim();
                              
                              // Format headers
                              if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
                                const headerText = trimmed.replace(/\*\*/g, '');
                                return (
                                  <h4 key={idx} className="font-semibold text-gray-900 mt-3 mb-2 text-base first:mt-0">
                                    {headerText}
                                  </h4>
                                );
                              }
                              
                              // Format bullet points
                              if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                                const bulletText = trimmed.replace(/^[-•]\s+/, '');
                                return (
                                  <div key={idx} className="flex items-start space-x-2 ml-2 my-1">
                                    <span className="text-blue-600 mt-1.5">•</span>
                                    <span className="flex-1">{bulletText}</span>
                                  </div>
                                );
                              }
                              
                              // Format numbered lists
                              if (/^\d+\.\s/.test(trimmed)) {
                                return (
                                  <div key={idx} className="flex items-start space-x-2 ml-2 my-1">
                                    <span className="text-blue-600 font-medium mt-0.5">{trimmed.match(/^\d+\./)?.[0]}</span>
                                    <span className="flex-1">{trimmed.replace(/^\d+\.\s+/, '')}</span>
                                  </div>
                                );
                              }
                              
                              // Regular paragraph
                              if (trimmed) {
                                return (
                                  <p key={idx} className="my-1.5 leading-relaxed">
                                    {trimmed}
                                  </p>
                                );
                              }
                              
                              return <br key={idx} />;
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className={`text-xs mt-2 opacity-70 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-sm shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">{t('ai.assistant.aiThinking')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('ai.assistant.placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{t('ai.assistant.send')}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setInputMessage(t('ai.assistant.symptomCheckExample'))}
            className="p-4 bg-white rounded-lg shadow border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">{t('ai.assistant.symptomCheck')}</h4>
            <p className="text-sm text-gray-500">{t('ai.assistant.symptomCheckDesc')}</p>
          </button>
          
          <button
            onClick={() => setInputMessage(t('ai.assistant.treatmentInfoExample'))}
            className="p-4 bg-white rounded-lg shadow border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Brain className="h-4 w-4 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">{t('ai.assistant.treatmentInfo')}</h4>
            <p className="text-sm text-gray-500">{t('ai.assistant.treatmentInfoDesc')}</p>
          </button>
          
          <button
            onClick={() => setInputMessage(t('ai.assistant.lifestyleTipsExample'))}
            className="p-4 bg-white rounded-lg shadow border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">{t('ai.assistant.lifestyleTips')}</h4>
            <p className="text-sm text-gray-500">{t('ai.assistant.lifestyleTipsDesc')}</p>
          </button>
          
          <button
            onClick={() => setInputMessage(t('ai.assistant.medicationInfoExample'))}
            className="p-4 bg-white rounded-lg shadow border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <Bot className="h-4 w-4 text-orange-600" />
            </div>
            <h4 className="font-medium text-gray-900">{t('ai.assistant.medicationInfo')}</h4>
            <p className="text-sm text-gray-500">{t('ai.assistant.medicationInfoDesc')}</p>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-white font-bold">!</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">{t('ai.assistant.disclaimerTitle')}</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {t('ai.assistant.disclaimerText')}
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
