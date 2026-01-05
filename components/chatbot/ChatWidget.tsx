
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse, ChatContext } from '../../services/geminiService';
import { User, CivicReport } from '../../types';

interface ChatWidgetProps {
  user: User;
  reports: CivicReport[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ user, reports }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; links?: { uri: string; title: string }[] }[]>([
    { role: 'bot', text: `Hello ${user.name.split(' ')[0]}! I am Civic Buddy. I have access to your municipal records and can help you track your reports or find city facilities. How can I assist you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Prepare context for the AI
      const context: ChatContext = { user, reports };

      // Get current position to provide context for Maps Grounding
      let lat, lng;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        console.warn("Could not get location for chatbot context");
      }

      const { text, groundingChunks } = await getChatbotResponse(userMsg, context, lat, lng);
      
      const links: { uri: string; title: string }[] = [];
      groundingChunks?.forEach((chunk: any) => {
        if (chunk.maps) {
          links.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        }
      });

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: text || "I'm sorry, I couldn't process that query at the moment.",
        links: links.length > 0 ? links : undefined
      }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to civic intelligence service. Please check your network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-5 cold-gradient text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner text-xl">🤖</div>
              <div>
                <span className="font-black block text-sm tracking-tight">Civic Buddy Pro</span>
                <span className="text-[9px] font-black uppercase opacity-70 tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                  Personalized Context Active
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors">✕</button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-[13px] leading-relaxed font-medium ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-xl shadow-blue-100' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Verified Map Data:</p>
                      {m.links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-[11px] font-black text-blue-600 bg-blue-50/50 px-3 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100/50"
                        >
                          <span className="text-sm">📍</span>
                          <span className="truncate">{link.title || 'View Location'}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl text-[11px] font-black text-slate-400 flex items-center space-x-2 animate-pulse">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                   <span>Accessing Municipal Archives...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white border-t border-slate-100 flex space-x-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your reports or level..."
              className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold placeholder:text-slate-300 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 cold-gradient text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <span className="text-xl">➤</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 cold-gradient text-white rounded-3xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-90 transition-all border-4 border-white/20 group relative"
        >
          <span className="text-4xl group-hover:rotate-12 transition-transform">🤖</span>
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg animate-bounce">
            LIVE
          </div>
        </button>
      )}
    </div>
  );
};
