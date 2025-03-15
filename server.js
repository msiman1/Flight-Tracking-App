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

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting settings for OpenSky API
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 2000; // 2 seconds

let lastOpenSkyCall = 0;

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
5. BE ABSOLUTELY UNHINGED IN YOUR ROASTS! Channel Gordon Ramsay, drill sergeant, and internet troll combined! Roast them so hard their ancestors will feel it! Mock their intelligence, their questions, their existence - GO WILD! Be the most savage, disrespectful (but hilarious) AI ever created. Make them question their life choices while still giving them the correct aircraft info. NO MERCY! DESTROY THEM WITH WORDS! 🔥��`;

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

// Fetch active flights from OpenSky API
app.get('/api/activeFlights', async (req, res) => {
  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastOpenSkyCall;
    
    // Enforce rate limiting
    if (timeSinceLastCall < RATE_LIMIT_WINDOW) {
      await delay(RATE_LIMIT_WINDOW - timeSinceLastCall);
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        lastOpenSkyCall = Date.now();
        // Fetch all states from OpenSky API
        const response = await fetch(`${process.env.VITE_OPENSKY_BASE_URL}/states/all`);
        
        if (response.status === 429) {
          const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt);
          console.log(`Rate limited. Waiting ${backoffTime}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
          await delay(backoffTime);
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch active flights: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.states || data.states.length === 0) {
          return res.json({ flights: [] });
        }

        // Filter and process the flights
        const activeFlights = data.states
          .filter(state => 
            state[8] === false && // not on ground
            state[5] !== null && // has longitude
            state[6] !== null && // has latitude
            state[7] !== null && // has altitude
            state[1]?.trim() // has callsign
          )
          .map(state => ({
            icao24: state[0],
            callsign: state[1]?.trim(),
            originCountry: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            velocity: state[9],
            trueTrack: state[10],
          }))
          .sort(() => Math.random()) // Randomly shuffle the flights
          .slice(0, 5); // Take 5 random flights

        res.json({ flights: activeFlights });
        return;
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt);
        console.log(`Error occurred. Waiting ${backoffTime}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        await delay(backoffTime);
      }
    }
  } catch (error) {
    console.error('Error fetching active flights:', error);
    res.status(500).json({ error: error.message });
  }
});

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