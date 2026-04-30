import axios from 'axios';

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    this.timeout = 120000; // 2 minutes timeout
  }

  async generateResponse(prompt) {
    try {
      console.log(' Sending request to Ollama...');
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent output
          top_p: 0.9,
          max_tokens: 2048
        }
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Received response from Ollama');
      return response.data.response;

    } catch (error) {
      console.error('Ollama API Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama service.');
      }
      
      if (error.code === 'ECONNRESET') {
        throw new Error('Connection to Ollama was reset. Please try again.');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('Request to Ollama timed out. Please try again.');
      }
      
      if (error.response && error.response.status === 404) {
        throw new Error(`Model '${this.model}' not found. Please run: ollama pull ${this.model}`);
      }
      
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      console.log('Testing Ollama connection...');
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: 'Respond with just "OK" to test connection.',
        stream: false
      }, {
        timeout: 10000
      });

      console.log('Ollama connection test successful');
      return { 
        success: true, 
        model: this.model,
        response: response.data.response 
      };

    } catch (error) {
      console.error('Ollama connection test failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models.map(model => model.name);
    } catch (error) {
      console.error('Failed to get available models:', error.message);
      return [];
    }
  }
}

export default new OllamaService();
