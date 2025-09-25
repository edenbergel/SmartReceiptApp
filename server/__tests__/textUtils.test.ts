import { extractStructuredData, inferCategory, normalizeCategoryHint } from '../utils/textUtils.js';

describe('textUtils', () => {
  it('extracts structured data and line items from OCR text', () => {
    const text = `Super Café Restaurant\n2x Latte 4,50\nCroissant 1,20\nDate: 12/03/2025\nTotal 15,90`;
    const result = extractStructuredData(text);

    expect(result.merchant).toBe('Super Café Restaurant');
    expect(result.date).toBe('12/03/2025');
    expect(result.amount).toBeCloseTo(15.9);
    expect(result.category).toBe('Food');
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems?.[0]).toMatchObject({ description: 'Latte', quantity: 2, total: 4.5 });
    expect(result.lineItems?.[1]).toMatchObject({ description: 'Croissant', total: 1.2 });
  });

  it('normalizes category hints and matches patterns', () => {
    const hint = 'Miscellaneous groceries';
    const cleaned = normalizeCategoryHint(hint);
    expect(cleaned).toBe('groceries');

    const category = inferCategory('Test', 'Grocery store receipt', hint);
    expect(category).toBe('Food');
  });
});
