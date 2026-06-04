/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Gemini Advanced Botanical Classification
  app.post('/api/classify-gemini', async (req, res) => {
    try {
      const { sepalLength, sepalWidth, petalLength, petalWidth } = req.body;

      if (
        sepalLength === undefined ||
        sepalWidth === undefined ||
        petalLength === undefined ||
        petalWidth === undefined
      ) {
        return res.status(400).json({ error: 'Missing dimensions (sepalLength, sepalWidth, petalLength, petalWidth)' });
      }

      const prompt = `Classify this Iris flower specimen with the following dimensions:
- Sepal Length: ${sepalLength} cm
- Sepal Width: ${sepalWidth} cm
- Petal Length: ${petalLength} cm
- Petal Width: ${petalWidth} cm

As an expert botanical classifier, compare these statistics against historical stats of standard species:
- Iris Setosa: Sepal L (4.3-5.8), Sepal W (2.3-4.4), Petal L (1.0-1.9), Petal W (0.1-0.6)
- Iris Versicolor: Sepal L (4.9-7.0), Sepal W (2.0-3.4), Petal L (3.0-5.1), Petal W (1.0-1.8)
- Iris Virginica: Sepal L (4.9-7.9), Sepal W (2.2-3.8), Petal L (4.5-6.9), Petal W (1.4-2.5)

Analyze the shape/dimensions. Give a taxonomic classification ('setosa', 'versicolor', or 'virginica') and write a highly informative explanation of why these dimensions correspond to this species, referencing the feature distributions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a professional botanical taxonomist who specializes in angiosperms, specifically the Iris genus and Fisher Iris dataset.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              species: {
                type: Type.STRING,
                description: 'Must be one of the literal values: setosa, versicolor, or virginica',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence level from 0.0 to 1.0 based on how clear-cut the dimensions are.',
              },
              explanation: {
                type: Type.STRING,
                description: 'A detailed, formal biological write-up arguing why these dimensions match this species and why others were discarded. Limit to 4-5 sentences.',
              },
            },
            required: ['species', 'confidence', 'explanation'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/classify-gemini:', error);
      res.status(500).json({
        error: 'AI Classification failed',
        details: error.message || error,
      });
    }
  });

  // Botanical Smart Assistant Chat (Contextual helper)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Missing content in request body' });
      }

      // Convert visual simple text history to formatted string
      const systemInstruction = `You are "Dr. Iris Flora", an AI botanical taxonomist and computational biologist. You are talking to students or developers visiting this GitHub project.
- Answer questions in a warm, scholarly, yet accessible manner.
- Be extremely knowledgeable about Ronald Fisher, his 1936 Iris Dataset, machine learning concepts (such as K-Nearest Neighbors, Decision Trees, distances, dimensions, and decision boundaries), and the botany of Setosa, Versicolor, and Virginica flowers.
- Do not make things up. If asked about unrelated topics, politely guide the focus back to botany, Iris flowers, or machine learning.
- Keep your answers clean, well-formatted in markdown, and concise (under 3 paragraphs).`;

      const contents = [];

      // Append historical conversation if it exists
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.role === 'user' || msg.role === 'model') {
            contents.push({
              role: msg.role,
              parts: [{ text: msg.parts }],
            });
          }
        });
      }

      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({
        error: 'Botanical Assistant is resting at the moment',
        details: error.message || error,
      });
    }
  });

  // --- Production and Development Routing Setup ---

  if (!isProduction) {
    // Vite middleware for fast development reloading without HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production from the dist directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started. Running in ${isProduction ? 'production' : 'development'} mode.`);
    console.log(`Access endpoint on http://0.0.0.0:${PORT}`);
  });
}

startServer();
