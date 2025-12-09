import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, Language } from '../types';
import { chatWithCoach } from '../services/gemini';
import { TRANSLATIONS } from '../constants';

interface ChatInterfaceProps {
  initialMessage?: string;
  context?: string;
  compact?: boolean;
  language: Language;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessage, context, compact = false, language }) => {
  const t = TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial message when language changes or on mount
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        content: initialMessage || t.chat.initial
      }
    ]);
  }, [initialMessage, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    if (context) {
      history.unshift({ role: 'user', content: `Context: ${context}` });
    }

    try {
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', isStreaming: true }]);

      await chatWithCoach(history, input, language, (text) => {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, content: text } : m
        ));
      });
      
      setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: language === 'zh' ? "抱歉，遇到技术故障，请重试。" : "Sorry, I encountered a technical foul. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${compact ? 'h-[400px]' : 'h-full'} bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-court-orange' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-court-orange text-white rounded-tr-none' 
                  : 'bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600'
              }`}>
                {msg.content ? (
                  <ReactMarkdown 
                    components={{
                      ul: ({node, ...props}) => <ul className="list-disc list-inside ml-2 my-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside ml-2 my-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-court-accent font-bold" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <Loader2 className="animate-spin w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.chat.placeholder}
          className="flex-1 bg-slate-800 text-white rounded-md px-4 py-2 border border-slate-700 focus:outline-none focus:border-court-orange transition-colors placeholder-slate-500"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-court-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;