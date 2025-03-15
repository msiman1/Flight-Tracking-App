import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  const prompt = `You are an assistant that explains aircraft telemetry data. Here is the data:\n${JSON.stringify(data, null, 2)}\nPlease provide a plain English explanation of the current state of the aircraft.`;

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 150,
    });
    const explanation = completion.data.choices[0].text?.trim() || 'No explanation generated.';
    res.status(200).json({ explanation });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
} 