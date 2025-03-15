/// <reference types="next" />
/// <reference types="openai" />

// src/pages/api/openaiChat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai';

// Initialize OpenAI configuration with your API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

if (!configuration.apiKey) {
  console.error('OpenAI API key is not configured');
}

const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!configuration.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured' });
  }

  try {
    const { prompt, conversation } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Build a messages array for chat completions
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: 'You are an assistant that summarizes aircraft data and provides insights.',
      },
    ];

    if (conversation && Array.isArray(conversation)) {
      messages.push(...conversation);
    }

    messages.push({
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: prompt,
    });

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    });

    if (!completion.data.choices[0].message) {
      throw new Error('No response from OpenAI');
    }

    res.status(200).json({ response: completion.data.choices[0].message });
  } catch (error: any) {
    console.error('OpenAI API error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'An error occurred while processing your request'
    });
  }
} 