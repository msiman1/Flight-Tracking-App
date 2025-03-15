import express from 'express';
import { Configuration, OpenAIApi } from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

if (!configuration.apiKey) {
  console.error('OpenAI API key is not configured');
}

const openai = new OpenAIApi(configuration);

// OpenAI chat endpoint
app.post('/api/openaiChat', async (req, res) => {
  if (!configuration.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured' });
  }

  try {
    const { prompt, conversation } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Build messages array for chat completions
    const messages = [
      {
        role: 'system',
        content: 'You are an assistant that summarizes aircraft data and provides insights.',
      },
    ];

    if (conversation && Array.isArray(conversation)) {
      messages.push(...conversation);
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    });

    if (!completion.data.choices[0].message) {
      throw new Error('No response from OpenAI');
    }

    res.json({ response: completion.data.choices[0].message });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'An error occurred while processing your request'
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 