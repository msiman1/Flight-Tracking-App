import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState<ChatMessage | null>(null);
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
        body: JSON.stringify({ prompt: input, conversation: updatedConversation }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
        // Optionally update the conversation with the assistant's reply
        setConversation([...updatedConversation, data.response]);
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request');
      setResponse({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginTop: '1rem' }}>
      <h2>Chatbot Assistant</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a summary or insights..."
          style={{ width: '70%', padding: '0.5rem' }}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem', marginLeft: '1rem' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <strong>Assistant:</strong> {response.content}
        </div>
      )}
    </div>
  );
} 