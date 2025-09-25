import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { ClientV2, BufferInput } from 'mindee';

const PORT = process.env.PORT ?? 4000;
const app = express();

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_MODEL_ID = process.env.MINDEE_MODEL_ID;
const mindeeClient = MINDEE_API_KEY
  ? new ClientV2({ apiKey: MINDEE_API_KEY })
  : undefined;

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'SmartReceipt OCR service' });
});

app.post('/ocr', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing receipt file' });
    }
    const fields = MINDEE_API_KEY
      ? await processWithMindee(req.file)
      : await processWithTesseract(req.file);

    res.json(fields);
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
  if (MINDEE_API_KEY) {
    console.log('Mindee integration enabled.');
  } else {
    console.log('Mindee integration disabled; using local Tesseract fallback.');
  }
});

async function processWithTesseract(file) {
  const { data } = await Tesseract.recognize(file.buffer, 'eng');
  const fields = extractStructuredData(data.text);
  return { ...fields, rawText: data.text };
}


async function processWithMindee(file) {
  if (!mindeeClient) {
    throw new Error('Mindee API key is not configured');
  }
  if (!MINDEE_MODEL_ID) {
    throw new Error('Mindee model ID is not configured');
  }

  const input = new BufferInput({
    buffer: file.buffer,
    filename: file.originalname ?? 'receipt.jpg',
  });

  const response = await mindeeClient.enqueueAndGetInference(input, {
    modelId: MINDEE_MODEL_ID,
    pollingOptions: {
      initialDelaySec: 1,
      delaySec: 1,
      maxRetries: 20,
    },
  });

  const prediction = response?.document?.inference?.prediction;
  if (!prediction) {
    console.error('Mindee payload unexpected', JSON.stringify(response, null, 2));
    throw new Error('Mindee response missing prediction data');
  }

  return mapMindeePrediction(prediction, response.document);
}

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

function mapMindeePrediction(prediction, document) {
  const {
    supplier_name,
    locale,
    total_amount,
    date,
    expense_category,
    document_tax_fields,
  } = prediction;

  const merchant = supplier_name?.value?.trim() || 'Unknown Merchant';
  const rawAmount = total_amount?.value ?? 0;
  const amount = typeof rawAmount === 'number' ? rawAmount : Number.parseFloat(rawAmount) || 0;
  const category = expense_category?.value ?? inferCategory(merchant, '') ?? 'Other';
  const parsedDate = normalizeMindeeDate(date?.value, locale?.value);

  const rawText = document?.inference?.pages
    ?.map((page) => page?.all_words?.map((word) => word?.text).join(' '))
    .join('\n') ?? null;

  return {
    merchant,
    date: parsedDate,
    amount,
    category,
    rawText: rawText ?? undefined,
  };
}

function normalizeMindeeDate(raw, locale) {
  if (!raw) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Mindee returns ISO-like YYYY-MM-DD by default
  if (/\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.split('-');
    return `${day}/${month}/${year}`;
  }

  // fallback to existing logic
  return inferDate(raw);
}
