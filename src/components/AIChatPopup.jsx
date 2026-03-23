import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import apiClient from '../config/api';

/**
 * AIChatPopup Component
 * A floating AI assistant for movie recommendations and booking help.
 */
const AIChatPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi, I’m your movie assistant. Ask me for movie suggestions, genres, timings, or help with booking.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userPrefs, setUserPrefs] = useState(null);
    const scrollRef = useRef(null);

    // Fetch user preferences for context when chat is opened
    useEffect(() => {
        const fetchPrefs = async () => {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                try {
                    const res = await apiClient.get('/api/auth/profile');
                    if (res.data.success && res.data.user.preferences) {
                        setUserPrefs(res.data.user.preferences);
                    }
                } catch (err) {
                    console.error("Failed to fetch preferences for AI context", err);
                }
            }
        };
        if (isOpen && !userPrefs) {
            fetchPrefs();
        }
    }, [isOpen, userPrefs]);

    const suggestionChips = [
        "Recommend a movie for tonight",
        "Suggest a family movie",
        "Find an action thriller",
        "Show trending movies"
    ];

    // Auto scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Send history to backend with user preferences for context
            const res = await apiClient.post('/api/ai/chat', { 
                messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                userPreferences: userPrefs
            });


            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having some trouble connecting right now. Please try again later." }]);
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Something went wrong. Make sure your internet is working and try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Helper to render stylish markdown-like text
    const renderContent = (content) => {
        if (!content) return null;
        
        // Simple regex for bold **text** and italic *text*
        const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white tracking-wide">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="relative w-14 h-14 bg-gradient-to-tr from-red-600 to-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95 group"
                >
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center animate-bounce shadow-md">
                        <Sparkles size={10} className="text-red-600" />
                    </div>
                    <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] sm:w-[420px] h-[550px] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500 ease-out">
                    
                    {/* Header */}
                    <div className="bg-zinc-900/50 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 rounded-full flex items-center justify-center border-2 border-zinc-900">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white tracking-tight">CineVerse AI</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Premium Assistant</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2.5 hover:bg-zinc-800/80 rounded-2xl text-zinc-500 hover:text-white transition-all shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-hide"
                    >
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
                                    m.role === 'user' 
                                    ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none font-medium' 
                                    : 'bg-zinc-900/80 backdrop-blur-sm text-zinc-300 border border-zinc-800/50 rounded-tl-none'
                                }`}>
                                    {renderContent(m.content)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl rounded-tl-none px-5 py-3.5 flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Bot is typing</span>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Suggestion Chips */}
                    {!isLoading && messages.length <= 2 && (
                        <div className="px-6 pb-4 flex flex-wrap gap-2">
                            {suggestionChips.map((chip, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(chip)}
                                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-600 rounded-full text-[10px] sm:text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    {chip} <ChevronRight size={10} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                        <div className="relative flex items-center">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-2xl pl-5 pr-12 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-600"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`absolute right-2 p-2 rounded-xl transition-all ${
                                    input.trim() && !isLoading 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatPopup;
