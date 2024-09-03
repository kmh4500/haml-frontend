import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { haml } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: `You are a hyper agent markup language (haml) assistant.
            - round: (Required) The number of turns or exchanges in the conversation.
            - stake: (Optional) The importance or influence of the agent in the conversation (e.g., 1 being less influential, 5 being most influential).` },
          { role: 'user', content: `Please generate a conversation based on the following HAML. Output must be in a pure html text. Vote, Fund button must call metamask sign script using ethereum.request({ method: 'eth_requestAccounts' }). The code must be fully functional.: ${haml}` }
        ],
        temperature: 1,
        max_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: {
          "type": "text"
        },
      });
      res.status(200).json({ result: response.choices[0].message.content });
    } catch (error) {
      console.error('Error fetching conversation from GPT-4o:', error);
      res.status(500).json({ error: 'Failed to generate conversation' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
