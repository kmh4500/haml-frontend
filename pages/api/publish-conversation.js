import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { address, keyword, conversation } = req.body;

    try {
      const filePath = path.join(process.cwd(), 'public', `${keyword}.html`);

      // Ensure the directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // Write the conversation content directly to the file
      fs.writeFileSync(filePath, conversation, 'utf8');

      res.status(200).json({ message: 'Conversation published successfully' });
    } catch (error) {
      console.error('Error publishing conversation:', error);
      res.status(500).json({ error: 'Failed to publish conversation' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
