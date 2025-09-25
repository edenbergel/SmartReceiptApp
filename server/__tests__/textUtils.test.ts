import { extractStructuredData, inferCategory, normalizeCategoryHint } from '../utils/textUtils.js';

describe('textUtils', () => {
  it('extracts structured data from OCR text', () => {
    const text = `Super Café Restaurant\nDate: 12/03/2025\nTotal 15,90`;
    const result = extractStructuredData(text);

    expect(result.merchant).toBe('Super Café Restaurant');
    expect(result.date).toBe('12/03/2025');
    expect(result.amount).toBeCloseTo(15.9);
    expect(result.category).toBe('Food');
  });

  it('normalizes category hints and matches patterns', () => {
    const hint = 'Miscellaneous groceries';
    const cleaned = normalizeCategoryHint(hint);
    expect(cleaned).toBe('groceries');

    const category = inferCategory('Test', 'Grocery store receipt', hint);
    expect(category).toBe('Food');
  });
});
