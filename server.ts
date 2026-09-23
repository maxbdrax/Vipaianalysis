import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/apiRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use('/api', apiRouter);

// Serve static frontend assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WIN GO AI VIP ANALYZER server running on port ${PORT}`);
});
