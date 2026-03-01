
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'bot' | 'user';
  text: string;
}

/**
 * STRATEGIC MESSAGE RENDERER
 * Parses common markdown patterns like bolding, headers, and lists 
 * to ensure answers are properly arranged and readable under stress.
 */
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  // Split by line to handle block-level formatting (lists, headers)
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        let content = line.trim();
        if (!content) return <div key={idx} className="h-2" />;

        // Header detection (###)
        if (content.startsWith('###')) {
          return (
            <h5 key={idx} className="font-black text-red-600 uppercase tracking-tighter text-xs mt-4 mb-2">
              {content.replace('###', '').trim()}
            </h5>
          );
        }

        // List item detection (- or *)
        if (content.startsWith('-') || content.startsWith('*') || content.startsWith('•')) {
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-red-500 font-black">•</span>
              <p className="flex-1">{renderInlineStyles(content.substring(1).trim())}</p>
            </div>
          );
        }

        // Numbered list detection (1. 2. etc)
        if (/^\d+\./.test(content)) {
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-red-500 font-black">{content.match(/^\d+\./)?.[0]}</span>
              <p className="flex-1">{renderInlineStyles(content.replace(/^\d+\./, '').trim())}</p>
            </div>
          );
        }

        return <p key={idx}>{renderInlineStyles(content)}</p>;
      })}
    </div>
  );
};

// Helper for bolding (**text**)
const renderInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '### STATUS: NODE_ONLINE\n\nNamaste Citizen. I am the **CrisisLink AI Assistant**. How can I assist your sector with safety protocols or incident reporting today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSend,
        config: {
          systemInstruction: `You are the CrisisLink AI Assistant, a specialized emergency coordination expert for India. 
          
          CORE FORMATTING RULE:
          - DO NOT output walls of text.
          - Use ### for Section Headers.
          - Use **Bold** for critical safety terms and commands.
          - Use bullet points (-) for checklists and measures.
          - Use numbered lists (1. 2.) for step-by-step procedures.
          - Keep answers organized, technical, and extremely easy to read.

          SAFETY KNOWLEDGE (NDMA GUIDELINES):
          - EARTHQUAKE: ### IMMEDIATE STEPS: 1. **Drop** 2. **Cover** 3. **Hold**.
          - FLOOD: ### MITIGATION: - Move up. - Kill power. - Avoid moving water.
          - HEATWAVE: ### PREVENTIVE MEASURES: - Hydrate with ORS. - Avoid peak sun (12-4 PM).
          
          APP COMMANDS:
          - Use /report for **AI-Verified Incident Reporting**.
          - Use /map for **Live Tactical Visibility**.
          
          URGENCY: If life-threat is mentioned, start with: "### CALL FOR HELP: Dial **100, 101, 102, or 108** immediately!"`,
          temperature: 0.5,
        },
      });

      const botResponse = response.text || "### SIGNAL ERROR\nI apologize. Signal lost. Please check manual.";
      setMessages([...newMessages, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages([...newMessages, { role: 'bot', text: "### LINK FAILURE\nConnection to command hub timed out." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQueries = [
    "Earthquake safety?",
    "Flood measures",
    "Heatwave advice",
    "How to report?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[550px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-red-600 rounded-xl shadow-lg">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-widest">CrisisLink AI</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tactical Node Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors relative z-10">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-6 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-red-600 text-white rounded-br-none font-bold' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}>
                  <FormattedMessage text={m.text} />
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 rounded-bl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-red-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Processing Intelligence...</span>
                </div>
              </div>
            )}

            {messages.length < 3 && !isTyping && (
              <div className="pt-2 flex flex-wrap gap-2">
                {suggestedQueries.map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSend(q)}
                    className="text-[10px] font-black uppercase tracking-tight bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full hover:border-red-500 hover:text-red-600 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Warning Banner */}
          <div className="px-4 py-2 bg-red-50 border-y border-red-100 flex items-center gap-2">
            <AlertCircle size={12} className="text-red-600" />
            <p className="text-[9px] font-bold text-red-800 uppercase tracking-tight">For life-threats, dial 100/101/102 immediately.</p>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for safety measures..."
                className="flex-grow pl-4 pr-12 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-red-500 outline-none placeholder:text-slate-400"
              />
              <button 
                disabled={!input.trim() || isTyping}
                onClick={() => handleSend()}
                className="absolute right-2 p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-30 disabled:scale-95 transition-all shadow-lg shadow-red-200"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-black transition-all duration-300 group relative border-2 border-red-600"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full"></div>
          <Bot size={32} />
          <div className="absolute -bottom-10 right-0 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest shadow-xl pointer-events-none">
            AI Assistant Online
          </div>
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;
