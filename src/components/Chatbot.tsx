import { useState } from 'react';
import { AircraftData } from '@/types/aircraft';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-4">
      <h2 className="text-lg font-semibold mb-4">Aircraft Assistant</h2>
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={aircraftData ? "Ask about the aircraft's status, location, or other details..." : "Search for an aircraft first to get started..."}
            className="flex-1 px-3 py-2 border rounded-md"
            disabled={!aircraftData}
            required
          />
          <button 
            type="submit" 
            disabled={loading || !aircraftData} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
      <div className="mt-4 space-y-4">
        {conversation.map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
            }`}
          >
            <strong>{msg.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
            {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
} 