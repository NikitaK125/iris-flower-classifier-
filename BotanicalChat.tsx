/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Why are petals better for classification?',
  'Explain KNN vs Decision Tree concepts',
  'Who is Ronald Fisher and why is this dataset famous?',
  'How do I use this on my GitHub portfolio?',
];

export const BotanicalChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I am **Dr. Iris Flora**, your AI companion for this computational biology project. 
      
I can explain everything about the standard **Fisher's Iris dataset (1936)**, the botany of *Setosa*, *Versicolor*, and *Virginica*, and how classic machine learning algorithms identify these flowers.

What botanical or mathematical query can I help you unpack today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    setErrorStatus(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Create simple historical context array for Gemini
      const chatHistory = messages
        .filter((m) => m.id !== 'init-1') // skip intro message to keep it clean
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: m.text,
        }));

      const res = await fetch('/api/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: textToSend,
           history: chatHistory,
         }),
      });

      if (!res.ok) {
        throw new Error('Our botanical systems experienced a lag.');
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'I analyzed the soil, but found no answer. Could you ask that differently?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Server did not respond');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#0a0b0d] rounded-sm border border-white/10 flex flex-col h-[520px]" id="botanical-chat-sec">
      {/* Assistant Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center text-white/90 font-serif italic text-sm border border-white/20 shadow-sm">
              IF
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif italic text-white text-base">Dr. Iris Flora</h4>
            <p className="text-[9px] text-[#a8b8d0] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-2.5 w-2.5 text-white/60" />
              BOTANICAL TAXONOMIST & AI COMPANION
            </p>
          </div>
        </div>
      </div>

      {/* Message Feed Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-sm text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-white text-black rounded-tr-none shadow-sm'
                  : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Formatter helper to render simple bolding and paragraphs */}
              {msg.text.split('\n').map((para, pIdx) => {
                if (!para) return <div key={pIdx} className="h-2" />;
                
                // Very simple markdown bold parser
                const parts = para.split('**');
                return (
                  <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                    {parts.map((part, partIdx) => 
                      partIdx % 2 === 1 ? <strong key={partIdx} className="font-bold text-white">{part}</strong> : part
                    )}
                  </p>
                );
              })}
            </div>
            <span className="text-[8px] text-white/30 uppercase tracking-wider font-mono mt-1 px-1 font-semibold">{msg.timestamp}</span>
          </div>
        ))}

        {isSending && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <div className="bg-white/5 border border-white/10 p-3 rounded-sm rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {errorStatus && (
          <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-sm max-w-md mx-auto text-xs mt-2 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>AI lag threshold exceeded: "{errorStatus}". Query again.</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Input Quick Prompts */}
      <div className="p-2 border-t border-white/10 flex flex-wrap gap-1.5 bg-transparent">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => handleSendMessage(question)}
            className="text-[9px] bg-white/5 text-white/60 border border-white/5 rounded-sm p-1 px-2.5 hover:bg-white/10 hover:text-white text-left transition font-bold uppercase tracking-wider font-mono"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Editor footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 border-t border-white/10 bg-white/5 rounded-b-sm flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a botanical or ML classification question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
          className="flex-1 bg-white/5 border border-white/10 py-2.5 px-3 rounded-sm text-xs text-white outline-none focus:border-white/30 placeholder:text-white/20 font-mono"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-white hover:bg-white/95 disabled:opacity-30 rounded-sm text-black transition shrink-0 border border-white/10"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
