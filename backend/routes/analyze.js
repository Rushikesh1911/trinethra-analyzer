import express from 'express';
import ollamaService from '../services/ollamaService.js';
import promptService from '../services/promptService.js';
import responseParser from '../utils/responseParser.js';

const router = express.Router();

// POST /api/analyze
router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;

    // this function validate input we get
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Transcript is required',
        message: 'Please provide a supervisor transcript for analysis'
      });
    }

    if (transcript.length < 100) {
      return res.status(400).json({
        error: 'Transcript too short',
        message: 'Transcript is too brief for meaningful analysis. Please provide more content.'
      });
    }

    console.log('Analyzing transcript:', transcript.substring(0, 100) + '...');

    //  generation of the prompt by llm provider 
    const prompt = promptService.generateAnalysisPrompt(transcript);
    
    //sending of the prompt to the llm provider ollama
    const llmResponse = await ollamaService.generateResponse(prompt);
    
    // this helps to parse response from the llm provider ollama
    const analysis = responseParser.parseAnalysis(llmResponse);
    
    console.log('Analysis completed successfully');
    
    res.json({
      success: true,
      data: analysis,
      metadata: {
        model: process.env.OLLAMA_MODEL,
        timestamp: new Date().toISOString(),
        transcriptLength: transcript.length
      }
    });

  } catch (error) {
    console.error('Analysis failed:', error.message);
    
    // for handling different types of errors
    if (error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Ollama service unavailable',
        message: 'Please ensure Ollama is running on localhost:11434'
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'Analysis took too long. Please try again.'
      });
    }
    
    res.status(500).json({
      error: 'Analysis failed',
      message: 'An error occurred during transcript analysis'
    });
  }
});

export default router;