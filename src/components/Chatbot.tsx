import { useState } from 'react';
import { AircraftData } from '@/types/aircraft';
import { X, Send, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatbotProps {
  aircraftData: AircraftData | null;
}

export default function Chatbot({ aircraftData }: ChatbotProps) {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);

    // Add the user's message to the conversation history
    const userMessage: ChatMessage = { role: 'user', content: input };
    const updatedConversation = [...conversation, userMessage];

    try {
      const res = await fetch('/api/openaiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input, 
          conversation: updatedConversation,
          aircraftData: aircraftData || undefined
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.response) {
        // Update the conversation with the assistant's reply
        setConversation([...updatedConversation, data.response]);
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request');
      setConversation([...updatedConversation, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 p-4 rounded-full shadow-lg transition-colors duration-200 z-[9999] ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <span className="text-2xl">😈</span>
        )}
      </button>

      {/* Chat Window */}
      <div className={`fixed right-4 bottom-20 w-96 transition-all duration-300 transform z-[9999] ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="rounded-lg border bg-white shadow-xl flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b bg-blue-500 text-white rounded-t-lg flex justify-between items-center">
            <h2 className="font-semibold">Chat with Mario</h2>
            {error && (
              <div className="text-red-200 text-sm">
                Error: {error}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                {aircraftData 
                  ? "Ask me anything about the aircraft's status, location, or other details!"
                  : "Search for an aircraft to get started!"}
              </div>
            )}
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={aircraftData 
                  ? "Type your message..." 
                  : "Search for an aircraft first..."}
                className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!aircraftData || loading}
                required
              />
              <button 
                type="submit" 
                disabled={loading || !aircraftData || !input.trim()} 
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 