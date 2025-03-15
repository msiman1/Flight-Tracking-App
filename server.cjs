const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = 3001;

// Initialize OpenAI configuration with your API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.use(express.json());

app.post('/api/openaiChat', async (req, res) => {
  const { prompt, conversation } = req.body;
  // Build a messages array for chat completions
  const messages = [
    { role: 'system', content: 'You are an assistant that summarizes aircraft data and provides insights.' },
  ];

  if (conversation && Array.isArray(conversation)) {
    messages.push(...conversation);
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const responseMessage = completion.data.choices[0].message;
    res.json({ response: responseMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`API server listening on port ${port}`)); 