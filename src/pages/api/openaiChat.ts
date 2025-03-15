/// <reference types="next" />
/// <reference types="openai" />

// src/pages/api/openaiChat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI configuration with your API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { prompt, conversation } = req.body;
    
    // Build a messages array for chat completions
    const messages = [
      { role: 'system', content: 'You are an assistant that summarizes aircraft data and provides insights.' },
    ];

    if (conversation && Array.isArray(conversation)) {
      messages.push(...conversation);
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const responseMessage = completion.data.choices[0].message;
    res.status(200).json({ response: responseMessage });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 