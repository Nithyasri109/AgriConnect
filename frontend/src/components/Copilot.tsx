import React, { useState, useEffect, useRef } from 'react';
import { useFarm } from '../context/FarmContext.tsx';
import { MessageSquare, X, Send, Bot, RefreshCw } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const Copilot: React.FC = () => {
  const { sendCopilotChat, currentLanguage, setCurrentLanguage } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting based on language
  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'bot')) {
      const greetings = {
        en: 'Hello! I am your Farmer Assistant. How can I help you today?',
        ta: 'வணக்கம்! நான் உங்கள் பண்ணை உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
        hi: 'नमस्ते! मैं आपका किसान सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?'
      };
      setMessages([
        {
          sender: 'bot',
          text: greetings[currentLanguage] || greetings.en,
          timestamp: new Date()
        }
      ]);
    }
  }, [currentLanguage]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendCopilotChat(textToSend);
      const botMsg: Message = {
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = currentLanguage === 'ta' 
    ? [
        'இன்று நான் தண்ணீர் பாய்ச்ச வேண்டுமா?',
        'ஏன் எனது பண்ணை ஆரோக்கியம் 84 ஆக உள்ளது?',
        'இன்று நான் என்ன செய்ய வேண்டும்?',
        'இன்று மழை பெய்யுமா?'
      ]
    : currentLanguage === 'hi'
    ? [
        'क्या मुझे आज पानी देना चाहिए?',
        'मेरा खेत स्वास्थ्य स्कोर 84 क्यों है?',
        'मुझे आज क्या करना चाहिए?',
        'क्या आज बारिश की संभावना है?'
      ]
    : [
        'Should I water my crop today?',
        'Why is my farm health score 84?',
        'What should I do today?',
        'Is rain expected?'
      ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-outfit">
      {/* Floating Chat Bubble - Dark Charcoal Theme */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="btn-open-copilot"
          className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#1F2937] hover:bg-[#111827] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-700/60 font-semibold text-xs select-none"
          title="Open Farmer Assistant"
        >
          <MessageSquare className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Need Help?</span>
        </button>
      )}

      {/* Expanded Copilot Panel - Premium Dark Theme */}
      {isOpen && (
        <div className="flex h-[500px] md:h-[550px] w-[320px] md:w-96 flex-col rounded-3xl bg-[#111827] shadow-2xl overflow-hidden border border-slate-800 text-white z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#0B0F19] p-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Bot className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-white">Farmer Assistant</h3>
                <div className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-medium">Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as any)}
                className="text-[10px] font-bold bg-[#1F2937] text-white border border-slate-700/50 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिन्दी</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                title="Minimize chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111827]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-[#1F2937] text-slate-100 border border-slate-800 rounded-bl-none'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1F2937] text-slate-200 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center space-x-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="px-4 py-3 bg-[#0B0F19] border-t border-slate-800 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="text-[10px] bg-[#1F2937] hover:bg-[#374151] text-slate-300 hover:text-white py-1.5 px-3 rounded-full border border-slate-800 text-left transition-colors font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-[#0B0F19] border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentLanguage === 'ta' 
                  ? 'பயிர்கள், மண், விநியோகம் குறித்து கேளுங்கள்...' 
                  : currentLanguage === 'hi'
                  ? 'फसल, मिट्टी, डिलीवरी के बारे में पूछें...'
                  : 'Ask about crops, soil, delivery, or plant health...'
              }
              className="flex-1 bg-[#1F2937] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500 transition-all shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
