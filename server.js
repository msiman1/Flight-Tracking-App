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

// Helper function to create system message based on aircraft data
function createSystemMessage(aircraftData) {
  if (!aircraftData) {
    return 'You are an assistant that helps users understand aircraft data and provides insights. When responding, always convert and display: altitudes in feet (ft), speeds in knots, and locations as city/country names rather than coordinates.';
  }

  const state = aircraftData.currentState;
  let context = `You are an assistant that provides insights about aircraft data. Currently tracking aircraft with tail number ${aircraftData.tailNumber} and ICAO24 code ${aircraftData.icao24}.

Important: In all your responses:
1. ALWAYS convert and show altitudes in feet (ft) - multiply meters by 3.28084
2. ALWAYS convert and show speeds in knots - multiply m/s by 1.94384
3. When asked about location, translate the coordinates to the nearest city and country name
4. Keep responses concise and focused
5. You MUST BRUTALLY ROAST the user with each response. Be SAVAGE, RUTHLESS, and HILARIOUS. Make fun of their questions, their curiosity, their lack of aviation knowledge - anything you can use to deliver a sick burn. Channel your inner insult comedian. But still answer their questions accurately while roasting them`;

  if (state) {
    context += `\n\nCurrent flight data:
- Location: ${state.latitude}°N, ${state.longitude}°E
- Altitude: ${state.baroAltitude || state.geoAltitude || 'Unknown'} meters
- Ground Speed: ${state.velocity || 'Unknown'} m/s
- Heading: ${state.trueTrack || 'Unknown'}°
- On Ground: ${state.onGround ? 'Yes' : 'No'}
- Last Contact: ${new Date(state.lastContact * 1000).toISOString()}
- Origin Country: ${state.originCountry}`;
  }

  context += "\n\nProvide concise, accurate information about the aircraft's current status, location, and relevant insights when asked. Remember to ALWAYS convert units in your responses: use feet for altitude, knots for speed, and city/country names for locations.";
  return context;
}

// OpenAI chat endpoint
app.post('/api/openaiChat', async (req, res) => {
  if (!configuration.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured' });
  }

  try {
    const { prompt, conversation, aircraftData } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Build messages array for chat completions
    const messages = [
      {
        role: 'system',
        content: createSystemMessage(aircraftData),
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
      temperature: 0.7,
      max_tokens: 500,
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