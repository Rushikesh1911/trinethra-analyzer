import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRoutes from './routes/analyze.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trinethra Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Trinethra Backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Ollama URL: ${process.env.OLLAMA_URL}`);
  console.log(`Ollama Model: ${process.env.OLLAMA_MODEL}`);
});

export default app;