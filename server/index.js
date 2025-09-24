import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Tesseract from 'tesseract.js';

const PORT = process.env.PORT ?? 4000;
const app = express();

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'SmartReceipt OCR service' });
});

app.post('/ocr', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing receipt file' });
    }

    const imageBuffer = req.file.buffer;
    const { data } = await Tesseract.recognize(imageBuffer, 'eng');
    const fields = extractStructuredData(data.text);

    res.json({ ...fields, rawText: data.text });
  } catch (error) {
    console.error('[OCR] Failed to process receipt', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

app.listen(PORT, () => {
  console.log(`SmartReceipt OCR server listening on http://localhost:${PORT}`);
});

function extractStructuredData(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const merchant = inferMerchant(lines);
  const date = inferDate(text);
  const amount = inferAmount(text);
  const category = inferCategory(merchant, text);

  return {
    merchant,
    date,
    amount,
    category,
  };
}

function inferMerchant(lines) {
  if (lines.length === 0) {
    return 'Unknown Merchant';
  }

  // Frequently the merchant name is among the first lines, without prices.
  for (const line of lines.slice(0, 5)) {
    if (!/[0-9]/.test(line) && line.length > 2) {
      return line;
    }
  }

  return lines[0];
}

function inferDate(text) {
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const match = text.match(dateRegex);
  if (!match) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const normalized = match[1].replace(/-/g, '/');
  const [day, month, year] = normalized.split('/');
  const paddedYear = year.length === 2 ? `20${year}` : year;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${paddedYear}`;
}

function inferAmount(text) {
  const amountRegex = /([0-9]+[\.,][0-9]{2})/g;
  const matches = [...text.matchAll(amountRegex)].map((match) => match[1]);
  if (matches.length === 0) {
    return 0;
  }

  const normalized = matches[matches.length - 1].replace(',', '.');
  return Number.parseFloat(normalized);
}

function inferCategory(merchant, text) {
  const lower = `${merchant} ${text}`.toLowerCase();

  if (/uber|taxi|transport|bus|train/.test(lower)) {
    return 'Transport';
  }
  if (/monoprix|carrefour|market|supermarch/.test(lower)) {
    return 'Food';
  }
  if (/fnac|darty|electronique|boulanger|office/.test(lower)) {
    return 'Office';
  }
  if (/hotel|airbnb|voyage|travel|flight/.test(lower)) {
    return 'Travel';
  }
  if (/clinic|pharma|pharmacie|health/.test(lower)) {
    return 'Healthcare';
  }

  return 'Other';
}
