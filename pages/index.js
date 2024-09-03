import { useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [haml, setHaml] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setConversation(null);
    setPublishedUrl('');

    try {
      const response = await axios.post('/api/generate-conversation', { haml });
      setConversation(response.data.result);
    } catch (error) {
      setError('Failed to generate conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidKeyword = (keyword) => {
    // Regex to match URL-safe keywords: alphanumeric characters, hyphens, and underscores
    const regex = /^[a-zA-Z0-9-_]+$/;
    return regex.test(keyword);
  };

  const handlePublish = async () => {
    if (!conversation) {
      alert('Please generate a conversation first.');
      return;
    }

    if (!isValidKeyword(keyword)) {
      setError('Keyword is not valid. It should only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed!');
        return;
      }

      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const address = accounts[0];

      if (!address) {
        alert('Failed to retrieve MetaMask account.');
        return;
      }

      const message = `Publish conversation with keyword: ${keyword}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Call the API to save the conversation
      await axios.post('/api/publish-conversation', {
        address,
        keyword,
        conversation,
      });

      const url = `/${keyword}.html`;
      setPublishedUrl(url);
      alert(`Conversation published! Access it at ${url}`);
    } catch (error) {
      console.error('Failed to publish conversation:', error);
      setError('Failed to publish conversation. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hyper Agent Markup Language (HAML) Conversation Generator</h1>
      <textarea
        style={{ width: '100%', height: '200px' }}
        value={haml}
        onChange={(e) => setHaml(e.target.value)}
        placeholder="Paste your HAML here..."
      />
      <button
        onClick={handleGenerate}
        style={{ marginTop: '20px', padding: '10px 20px' }}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Conversation'}
      </button>
      {conversation && (
        <div style={{ marginTop: '20px' }}>
          <h2>Generated Conversation</h2>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            <p>{conversation}</p>
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword to publish"
            style={{ marginTop: '20px', padding: '5px' }}
          />
          <button
            onClick={handlePublish}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            Publish
          </button>
        </div>
      )}
      {publishedUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Conversation Published!</h3>
          <p>
            You can access it here: <a href={publishedUrl} target="_blank" rel="noopener noreferrer">{window.location.origin}{publishedUrl}</a>
          </p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Home;
