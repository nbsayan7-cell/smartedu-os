/**
 * Vercel Serverless Function Bridge for SmartEdu OS API
 * Routes all /api/* calls into the Express backend application.
 */
import app from '../server/index.js';

export default function handler(req, res) {
  return app(req, res);
}
