import OpenAI from "openai";
import dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js'; // XML to JS object parser
import axios from 'axios';

dotenv.config(); // Load environment variables from .env file

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { haml } = req.body;
    const summary = await handleDataSummary(haml);
    console.log("summary", summary);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: `You are a hyper agent markup language (haml) assistant. Assume javascript already implements following functions
            - stakeOnAgent(recepient)` },
          { role: 'user', content: `${summary}. Based on the above data summary, Please generate a conversation based on the following HAML. Output must be in a full html.: ${haml}` }
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
      
      let result = response.choices[0].message.content;
      result = result.replace(/```html|```/g, '').trim(); // Removing the ```html and ```
      
      // Insert the necessary scripts into the HTML
      result = insertScriptsIntoHTML(result);

      res.status(200).json({ result });
    } catch (error) {
      console.error('Error fetching conversation from GPT-4o:', error);
      res.status(500).json({ error: 'Failed to generate conversation' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
function extractUrlsFromParsedData(parsedData) {
  const urls = [];

  // Traverse through the context -> data nodes to extract URL values
  if (parsedData.article && parsedData.article.context && parsedData.article.context[0].data) {
    const dataElements = parsedData.article.context[0].data;
    dataElements.forEach((dataElement) => {
      if (dataElement.$ && dataElement.$.url) {
        urls.push(dataElement.$.url);
      }
    });
  }

  return urls;
}

// Main function to parse text input, extract URLs, and summarize
async function handleDataSummary(text) {
  try {
    // Parse the input text (assumed to be XML) into a JavaScript object
    const parsedData = await parseStringPromise(text);

    // Extract URLs from the parsed data
    const urls = extractUrlsFromParsedData(parsedData);

    // Summarize content based on extracted URLs
    const summary = await summarizeUrls(urls);

    return summary;
  } catch (error) {
    console.error('Error processing text input:', error);
    throw new Error('Failed to process text input');
  }
}

// Function to call summarize API with extracted URLs
async function summarizeUrls(urls) {
  try {
    // Check if URLs are valid and non-empty
    if (urls.length === 0) {
      throw new Error('No URLs found in the parsed data');
    }

    // Call the summarize API
    const response = await axios.post('http://localhost:3000/api/summarize', {
      urls: urls,
    });

    // Return the summarized content from the API response
    return response.data.summary;
  } catch (error) {
    console.error('Error during summarization:', error);
    throw new Error('Failed to summarize data');
  }
}

// Function to add <script> to <head> and <body> in the HTML
function insertScriptsIntoHTML(htmlContent) {
  const headScript = `<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>`;
  const bodyScript = `
    <script>
      const AIN_CONTRACT_ADDRESS = "0x3a810ff7211b40c4fa76205a14efe161615d0385";
      const AIN_ABI = [
          "function transfer(address to, uint256 value) public returns (bool)"
      ];

      async function requestAccounts() {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return accounts;
     }
      async function stakeOnAgent(recipient) {
        try {
          if (typeof window.ethereum !== 'undefined') {
            await requestAccounts();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const ainContract = new ethers.Contract(AIN_CONTRACT_ADDRESS, AIN_ABI, signer);
            const amount = ethers.utils.parseUnits("10", 18); // Stake 10 AIN
            const transaction = await ainContract.transfer(recipient, amount);
            console.log(\`Transaction hash: \${transaction.hash}\`);
          } else {
            console.error('MetaMask is not installed!');
          }
        } catch (error) {
          console.error('Error during staking:', error);
        }
      }
    </script>
  `;

  // Insert <script> tags into <head> and <body> or add them if they don't exist
  let updatedHTML = htmlContent;

  if (updatedHTML.includes('</head>')) {
    updatedHTML = updatedHTML.replace('</head>', `${headScript}\n</head>`);
  } else {
    updatedHTML = `${headScript}\n${updatedHTML}`;
  }

  if (updatedHTML.includes('</body>')) {
    updatedHTML = updatedHTML.replace('</body>', `${bodyScript}\n</body>`);
  } else {
    updatedHTML = `${updatedHTML}\n${bodyScript}`;
  }

  return updatedHTML;
}
