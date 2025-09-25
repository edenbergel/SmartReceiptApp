import { inferCategory, inferDate, normalizeCategoryHint } from './textUtils.js';

export function extractMindeeInference(response) {
  return (
    response?.inference ??
    response?.document?.inference ??
    response?.rawHttp?.inference ??
    response?.rawHttp?.document?.inference
  );
}

export function extractMindeeFields(inference, response) {
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

export function listMindeeFieldKeys(fields) {
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

export function mapMindeePrediction(fields, inference, response) {
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

  const lineItemsField =
    getMindeeField(fields, 'line_items') ??
    getMindeeField(fields, 'items') ??
    getMindeeField(fields, 'products');
  const lineItems = normalizeMindeeLineItems(lineItemsField);

  return {
    merchant,
    date: parsedDate,
    amount,
    category,
    rawText,
    lineItems,
  };
}

export function getMindeeField(fields, fieldName) {
  if (!fields || !fieldName) {
    return undefined;
  }

  if (typeof fields.get === 'function') {
    return fields.get(fieldName);
  }

  if (typeof fields === 'object') {
    return fields[fieldName];
  }

  return undefined;
}

export function getMindeeValue(fields, fieldNames) {
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

export function unwrapMindeeValue(field) {
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

export function resolveLocale(locale) {
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

export function normalizeMindeeAmount(value) {
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

export function extractRawTextFromMindee(inference, response) {
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

export function normalizeMindeeDate(raw, locale) {
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
        const numericYear = String(year).length === 2 ? `20${year}` : String(year);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${numericYear}`;
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

  if (typeof raw === 'string' && /\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.split('-');
    return `${day}/${month}/${year}`;
  }

  return inferDate(typeof raw === 'string' ? raw : String(raw ?? ''));
}

export function normalizeMindeeLineItems(field) {
  let items = unwrapMindeeValue(field);
  if (!Array.isArray(items)) {
    if (Array.isArray(field)) {
      items = field;
    } else if (field && Array.isArray(field.items)) {
      items = field.items;
    } else if (field && Array.isArray(field.value)) {
      items = field.value;
    } else {
      return [];
    }
  }

  return items
    .map((rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') {
        return undefined;
      }

      const descriptionValue = unwrapMindeeValue(
        rawItem.description ??
          rawItem.product ??
          rawItem.name ??
          rawItem.title ??
          rawItem.label ??
          rawItem,
      );
      const description = typeof descriptionValue === 'string' && descriptionValue.trim().length > 0
        ? descriptionValue.trim()
        : 'Article';

      const quantity = toOptionalNumber(
        unwrapMindeeValue(rawItem.quantity ?? rawItem.qty ?? rawItem.count ?? rawItem.quantity_value),
      );

      const unitPrice = toOptionalNumber(
        unwrapMindeeValue(rawItem.unit_price ?? rawItem.unitPrice ?? rawItem.price_unit ?? rawItem.price),
      );

      const total = toOptionalNumber(
        unwrapMindeeValue(
          rawItem.total_incl ??
            rawItem.total_excl ??
            rawItem.total ??
            rawItem.amount ??
            rawItem.value ??
            (quantity != null && unitPrice != null ? quantity * unitPrice : undefined),
        ),
      );

      return {
        description,
        quantity,
        unitPrice,
        total,
      };
    })
    .filter((item) => item !== undefined);
}

export function normalizeCategoryHintForMindee(value) {
  return normalizeCategoryHint(value);
}

function toOptionalNumber(value) {
  if (value == null) {
    return undefined;
  }
  const numeric = typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
