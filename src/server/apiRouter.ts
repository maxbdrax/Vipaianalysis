import express from 'express';
import { digitizeLotteryImage, explainStatisticalAnalysis } from './geminiService';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '25mb' }));

apiRouter.post('/gemini/digitize-image', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64Data in request payload' });
    }
    const results = await digitizeLotteryImage(base64Data, mimeType || 'image/jpeg');
    return res.json({ success: true, count: results.length, entries: results });
  } catch (error: any) {
    console.error('Error in /api/gemini/digitize-image:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to digitize image',
      details: String(error)
    });
  }
});

apiRouter.post('/gemini/explain-stats', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.topCandidates) {
      return res.status(400).json({ error: 'Missing statistical payload' });
    }
    const explanation = await explainStatisticalAnalysis(payload);
    return res.json({ success: true, explanation });
  } catch (error: any) {
    console.error('Error in /api/gemini/explain-stats:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate explanation',
      details: String(error)
    });
  }
});

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WIN GO AI VIP ANALYZER', timestamp: Date.now() });
});
