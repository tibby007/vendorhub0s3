import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { handler as vendorManagement } from './netlify/functions/vendor-management.js';

dotenv.config();

const app = express();
const port = 8888;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vendor management function is imported above

// Handle all vendor management requests
app.all('/.netlify/functions/vendor-management', async (req, res) => {
  try {
    // Create a mock Netlify event object
    const event = {
      httpMethod: req.method,
      path: req.path,
      queryStringParameters: req.query,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : null
    };

    // Create a mock context object with environment variables
    const context = {
      env: process.env
    };

    // Call the vendor management function
    const result = await vendorManagement(event, context);

    // Set response headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }

    // Send response
    res.status(result.statusCode || 200);
    if (result.body) {
      res.send(result.body);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Error in vendor management:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Dev server running on http://localhost:${port}`);
});