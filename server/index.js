import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { processWithTesseract } from './services/tesseractService.js';
import { createMindeeProcessor } from './services/mindeeService.js';

const PORT = process.env.PORT ?? 4000;
const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_MODEL_ID = process.env.MINDEE_MODEL_ID;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

const app = express();
app.use(cors());

const mindeeProcessor = createMindeeProcessor({
  apiKey: MINDEE_API_KEY,
  modelId: MINDEE_MODEL_ID,
  debug: process.env.MINDEE_DEBUG,
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'SmartReceipt OCR service' });
});

app.post('/ocr', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing receipt file' });
    }

    const processor = mindeeProcessor ?? processWithTesseract;
    const payload = await processor(req.file);

    res.json(payload);
  } catch (error) {
    console.error('[OCR] Failed to process receipt', error);
    res.status(500).json({
      error: 'Failed to process receipt',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`SmartReceipt OCR server listening on http://localhost:${PORT}`);
  if (mindeeProcessor) {
    console.log('Mindee integration enabled.');
  } else {
    console.log('Mindee integration disabled; using local Tesseract fallback.');
  }
});
