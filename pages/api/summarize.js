import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch and summarize content from URLs
async function fetchAndSummarize(urls) {
  const contents = [];

  // Fetch content from all URLs
  for (const url of urls) {
    try {
      const response = await axios.get(url);
      contents.push(response.data); // Store the content of the URL
    } catch (error) {
      console.error(`Error fetching URL: ${url}`, error);
    }
  }

  // Generate a summary using GPT-4o
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a summarization assistant.' },
        { role: 'user', content: `Please summarize the following content: ${contents.join('\n\n')}` },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary from GPT-4o:', error);
    throw new Error('Failed to generate summary');
  }
}

// Next.js API handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { urls } = req.body;

    try {
      // Fetch and summarize the content from the URLs
      const summary = await fetchAndSummarize(urls);

      res.status(200).json({ summary });
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({ error: 'Failed to fetch and summarize data' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

/*
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
      "urls": [
        "https://www.nasa.gov/humans-in-space/humans-to-mars",
        "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/Why_go_to_Mars"
      ]
    }'

  */
