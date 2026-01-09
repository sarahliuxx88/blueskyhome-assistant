const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

let appConfig = {
    chatgptApiKey: null,
    chatgptModel: 'gpt-3.5-turbo',
    apiBaseUrl: 'https://api.openai.com/v1'
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/config', (req, res) => {
    res.sendFile(__dirname + '/public/config.html');
});

app.get('/api/config', (req, res) => {
    res.json({
          model: appConfig.chatgptModel,
          apiBaseUrl: appConfig.apiBaseUrl,
          hasApiKey: !!appConfig.chatgptApiKey
    });
});

app.post('/api/config/chatgpt', (req, res) => {
    const { apiKey, model, apiBaseUrl } = req.body;

           if (!apiKey || !model) {
                 return res.status(400).json({
                         success: false,
                         message: 'API Key and Model are required'
                 });
           }

           appConfig.chatgptApiKey = apiKey;
    appConfig.chatgptModel = model;
    appConfig.apiBaseUrl = apiBaseUrl || 'https://api.openai.com/v1';

           res.json({
                 success: true,
                 message: 'Configuration saved successfully'
           });
});

app.post('/api/test-chatgpt', async (req, res) => {
    try {
          if (!appConfig.chatgptApiKey) {
                  return res.status(400).json({
                            success: false,
                            message: 'ChatGPT API Key not configured'
                  });
          }

      const response = await axios.post(
              `${appConfig.apiBaseUrl}/chat/completions`,
        {
                  model: appConfig.chatgptModel,
                  messages: [{ role: 'user', content: 'Say hello!' }],
                  max_tokens: 100
        },
        {
                  headers: {
                              'Authorization': `Bearer ${appConfig.chatgptApiKey}`,
                              'Content-Type': 'application/json'
                  }
        }
            );

      res.json({
              success: true,
              message: 'Connection successful!',
              response: response.data.choices[0].message.content
      });
    } catch (error) {
          res.status(500).json({
                  success: false,
                  message: 'Failed to connect to ChatGPT',
                  error: error.message
          });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
          const { message } = req.body;

      if (!message) {
              return res.status(400).json({ success: false, message: 'Message is required' });
      }

      if (!appConfig.chatgptApiKey) {
              return res.status(400).json({ success: false, message: 'ChatGPT is not configured' });
      }

      const response = await axios.post(
              `${appConfig.apiBaseUrl}/chat/completions`,
        {
                  model: appConfig.chatgptModel,
                  messages: [{ role: 'user', content: message }],
                  temperature: 0.7,
                  max_tokens: 500
        },
        {
                  headers: {
                              'Authorization': `Bearer ${appConfig.chatgptApiKey}`,
                              'Content-Type': 'application/json'
                  }
        }
            );

      res.json({
              success: true,
              message: response.data.choices[0].message.content
      });
    } catch (error) {
          res.status(500).json({
                  success: false,
                  message: 'Failed to process chat message',
                  error: error.message
          });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ BlueSkyHome Assistant running on port ${PORT}`);
});
