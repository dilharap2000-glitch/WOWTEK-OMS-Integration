/**
 * WOWTEK OMS — Vercel Serverless Function Handler
 * Routes all /api/* requests to the Express API Router
 */

import express from 'express';
import { apiRouter } from '../src/server/apiRouter';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all OMS endpoints
app.use('/api', apiRouter);
app.use('/', apiRouter);

export { app };
export default function handler(req: any, res: any) {
  return app(req, res);
}
