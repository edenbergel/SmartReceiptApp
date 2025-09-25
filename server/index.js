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

  const inference = extractMindeeInference(response);
  const fields = extractMindeeFields(inference, response);
  const fieldKeys = listMindeeFieldKeys(fields);

  if (!fields || fieldKeys.length === 0) {
    console.error('Mindee payload unexpected', JSON.stringify(response, null, 2));
    throw new Error('Mindee response missing prediction data');
  }

  if (process.env.MINDEE_DEBUG) {
    console.log('Mindee fields keys:', fieldKeys.join(', ') || '(none)');
  }

  return mapMindeePrediction(fields, inference, response);
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

const CATEGORY_PATTERNS = [
  { regex: /(grocery|groceries|grocer|supermarket|supermarch|food|restaurant|cafe|meal|resto|snack)/, label: 'Food' },
  { regex: /(uber|taxi|transport|bus|train|metro|cab|ride|parking|fuel|car rental|rent a car)/, label: 'Transport' },
  { regex: /(office|supplies|stationery|printer|ink|bureau)/, label: 'Office' },
  { regex: /(hotel|airbnb|voyage|travel|flight|airline|ticket|booking|lodging|hebergement)/, label: 'Travel' },
  { regex: /(clinic|pharma|pharmacie|health|medical|doctor|dentist|opticien|hospital)/, label: 'Healthcare' },
  { regex: /(shopping|retail|boutique|clothing|apparel|mall|store)/, label: 'Shopping' },
  { regex: /(entertainment|movie|cinema|concert|theatre|show|loisirs)/, label: 'Entertainment' },
];

function inferCategory(merchant, text, hint) {
  const sources = [normalizeCategoryHint(hint), merchant, text];

  for (const source of sources) {
    const matched = matchCategory(source);
    if (matched) {
      return matched;
    }
  }

  return 'Other';
}

function matchCategory(source) {
  if (!source) {
    return undefined;
  }
  const lower = source.toString().toLowerCase();
  for (const { regex, label } of CATEGORY_PATTERNS) {
    if (regex.test(lower)) {
      return label;
    }
  }
  return undefined;
}

function mapMindeePrediction(fields, inference, response) {
  const merchant =
    getMindeeValue(fields, ['supplier_name', 'merchant_name', 'company_name', 'supplier']) ??
    'Unknown Merchant';

  const rawText = extractRawTextFromMindee(inference, response);

  const rawAmount = getMindeeValue(fields, [
    'total_amount',
    'total_incl',
    'grand_total',
    'amount',
    'total',
  ]);
  const amount = normalizeMindeeAmount(rawAmount);

  const rawCategoryHint = getMindeeValue(fields, ['expense_category', 'purchase_category', 'category']);
  const category = inferCategory(merchant, rawText ?? '', rawCategoryHint);

  const rawDate = getMindeeValue(fields, ['date', 'purchase_date', 'invoice_date', 'datetime']);
  const localeInfo = getMindeeValue(fields, ['locale']);
  const localeValue = resolveLocale(localeInfo);
  const parsedDate = normalizeMindeeDate(rawDate, localeValue);

  return {
    merchant,
    date: parsedDate,
    amount,
    category,
    rawText,
  };
}

function extractMindeeInference(response) {
  return (
    response?.inference ??
    response?.document?.inference ??
    response?.rawHttp?.inference ??
    response?.rawHttp?.document?.inference
  );
}

function extractMindeeFields(inference, response) {
  if (inference?.result?.fields) {
    return inference.result.fields;
  }
  if (inference?.prediction?.fields) {
    return inference.prediction.fields;
  }
  if (inference?.fields) {
    return inference.fields;
  }
  if (Array.isArray(inference?.predictions) && inference.predictions.length > 0) {
    return extractMindeeFields(inference.predictions[0], response);
  }

  return (
    response?.rawHttp?.inference?.result?.fields ??
    response?.rawHttp?.document?.inference?.result?.fields ??
    response?.rawHttp?.result?.fields
  );
}

function listMindeeFieldKeys(fields) {
  if (!fields) {
    return [];
  }
  if (typeof fields.forEach === 'function') {
    const keys = [];
    fields.forEach((_value, key) => keys.push(key));
    return keys;
  }
  if (Array.isArray(fields)) {
    return fields.flatMap((entry) => listMindeeFieldKeys(entry));
  }
  if (typeof fields === 'object') {
    return Object.keys(fields);
  }
  return [];
}

function getMindeeValue(fields, fieldNames) {
  if (!fields) {
    return undefined;
  }
  const candidates = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

  for (const name of candidates) {
    if (!name) continue;
    let field;
    if (typeof fields.get === 'function') {
      field = fields.get(name);
    } else if (typeof fields === 'object') {
      field = fields[name];
    }

    const value = unwrapMindeeValue(field);
    if (Array.isArray(value)) {
      const first = value.find((item) => item !== undefined && item !== null && item !== '');
      if (first !== undefined) {
        return first;
      }
    } else if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function unwrapMindeeValue(field) {
  if (field == null) {
    return undefined;
  }
  if (typeof field !== 'object') {
    return field;
  }

  if (Array.isArray(field)) {
    const values = field
      .map((entry) => unwrapMindeeValue(entry))
      .filter((entry) => entry !== undefined && entry !== null);
    return values.length > 0 ? values : undefined;
  }

  const ctorName = field.constructor?.name;

  if (ctorName === 'SimpleField') {
    return field.value ?? undefined;
  }

  if (ctorName === 'ListField') {
    const items = field.items ?? [];
    const values = items
      .map((item) => unwrapMindeeValue(item))
      .filter((entry) => entry !== undefined && entry !== null);
    return values.length > 0 ? values : undefined;
  }

  if (ctorName === 'ObjectField') {
    const obj = {};
    if (field.fields && typeof field.fields.forEach === 'function') {
      field.fields.forEach((value, key) => {
        const unwrapped = unwrapMindeeValue(value);
        if (unwrapped !== undefined) {
          obj[key] = unwrapped;
        }
      });
    }
    return Object.keys(obj).length > 0 ? obj : undefined;
  }

  if (typeof field.forEach === 'function') {
    const obj = {};
    field.forEach((value, key) => {
      const unwrapped = unwrapMindeeValue(value);
      if (unwrapped !== undefined) {
        obj[key] = unwrapped;
      }
    });
    return Object.keys(obj).length > 0 ? obj : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(field, 'value')) {
    return unwrapMindeeValue(field.value);
  }
  if (Object.prototype.hasOwnProperty.call(field, 'content')) {
    return unwrapMindeeValue(field.content);
  }
  if (Object.prototype.hasOwnProperty.call(field, 'raw')) {
    return unwrapMindeeValue(field.raw);
  }
  if (Array.isArray(field.items)) {
    const values = field.items
      .map((item) => unwrapMindeeValue(item))
      .filter((entry) => entry !== undefined && entry !== null);
    return values.length > 0 ? values : undefined;
  }
  if (Array.isArray(field.values)) {
    const values = field.values
      .map((item) => unwrapMindeeValue(item))
      .filter((entry) => entry !== undefined && entry !== null);
    return values.length > 0 ? values : undefined;
  }

  return undefined;
}

function resolveLocale(locale) {
  if (!locale) {
    return undefined;
  }
  if (typeof locale === 'string') {
    return locale;
  }
  if (Array.isArray(locale)) {
    return resolveLocale(locale[0]);
  }
  if (typeof locale === 'object') {
    const language = locale.language ?? locale.lang ?? locale.locale;
    const country = locale.country ?? locale.country_code ?? locale.region;
    const parts = [language, country].filter(Boolean);
    return parts.length > 0 ? parts.join('-') : undefined;
  }
  return undefined;
}

function normalizeMindeeAmount(value) {
  if (value == null) {
    return 0;
  }
  if (Array.isArray(value)) {
    return normalizeMindeeAmount(value.find((v) => v != null));
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'amount')) {
      return normalizeMindeeAmount(value.amount);
    }
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      return normalizeMindeeAmount(value.value);
    }
  }
  return 0;
}

function extractRawTextFromMindee(inference, response) {
  const candidates = [
    inference?.result?.rawText,
    response?.rawHttp?.inference?.result?.raw_text,
    response?.rawHttp?.document?.inference?.result?.raw_text,
  ];

  for (const candidate of candidates) {
    const text = normalizeRawText(candidate);
    if (text) {
      return text;
    }
  }

  return undefined;
}

function normalizeRawText(rawText) {
  if (!rawText) {
    return undefined;
  }

  if (Array.isArray(rawText.pages)) {
    const content = rawText.pages
      .map((page) => {
        if (!page) return undefined;
        if (typeof page.content === 'string') {
          return page.content;
        }
        if (typeof page.toString === 'function') {
          const pageStr = page.toString();
          return typeof pageStr === 'string' ? pageStr : undefined;
        }
        return undefined;
      })
      .filter((part) => typeof part === 'string' && part.trim().length > 0)
      .join('\n');

    if (content.trim().length > 0) {
      return content;
    }
  }

  if (typeof rawText === 'string') {
    const trimmed = rawText.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof rawText.content === 'string') {
    const trimmed = rawText.content.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof rawText.toString === 'function' && rawText.toString !== Object.prototype.toString) {
    const asString = rawText.toString();
    if (typeof asString === 'string') {
      const trimmed = asString.trim();
      if (trimmed.length > 0 && trimmed !== '[object Object]') {
        return trimmed;
      }
    }
  }

  return undefined;
}

function normalizeMindeeDate(raw, locale) {
  if (!raw) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const [year, month, day] = raw.toISOString().split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      const [year, month, day] = date.toISOString().split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
  }

  if (typeof raw === 'object') {
    if (raw) {
      const day = raw.day ?? raw.day_numeric;
      const month = raw.month ?? raw.month_numeric;
      const year = raw.year ?? raw.year_numeric;
      if (day !== undefined && month !== undefined && year !== undefined) {
        const paddedYear = String(year).length === 2 ? `20${year}` : String(year);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${paddedYear}`;
      }
      if (Object.prototype.hasOwnProperty.call(raw, 'value')) {
        return normalizeMindeeDate(raw.value, locale);
      }
      if (Object.prototype.hasOwnProperty.call(raw, 'content')) {
        return normalizeMindeeDate(raw.content, locale);
      }
    }
    return normalizeMindeeDate(String(raw), locale);
  }

  // Mindee returns ISO-like YYYY-MM-DD by default
  if (typeof raw === 'string' && /\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.split('-');
    return `${day}/${month}/${year}`;
  }

  // fallback to existing logic
  return inferDate(raw);
}

function normalizeCategoryHint(value) {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return normalizeCategoryHint(value.find((entry) => entry));
  }
  if (typeof value === 'object') {
    const primary = value.value ?? value.content ?? value.label ?? value.name;
    if (primary) {
      return normalizeCategoryHint(primary);
    }
    return normalizeCategoryHint(Object.values(value));
  }
  const cleaned = value
    .toString()
    .replace(/\bmisc\w*\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}
