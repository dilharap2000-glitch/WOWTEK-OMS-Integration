/**
 * WOWTEK Order Management System — Express Production Server
 * Business: WOWTEK (wowtek.lk)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', apiRouter);

// Serve static frontend assets from dist in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WOWTEK OMS] Server active on port ${PORT}`);
  console.log(`[WOWTEK OMS] System URL: http://localhost:${PORT}`);
  console.log(`[WOWTEK OMS] Business: WOWTEK Sri Lanka (wowtek.lk)`);
});
