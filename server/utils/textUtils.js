export function extractStructuredData(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const merchant = inferMerchant(lines);
  const date = inferDate(text);
  const amount = inferAmount(text);
  const category = inferCategory(merchant, text, undefined);

  return {
    merchant,
    date,
    amount,
    category,
  };
}

export function inferMerchant(lines) {
  if (lines.length === 0) {
    return 'Unknown Merchant';
  }

  for (const line of lines.slice(0, 5)) {
    if (!/[0-9]/.test(line) && line.length > 2) {
      return line;
    }
  }

  return lines[0];
}

export function inferDate(text) {
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

export function inferAmount(text) {
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

export function inferCategory(merchant, text, hint) {
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

export function normalizeCategoryHint(value) {
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
