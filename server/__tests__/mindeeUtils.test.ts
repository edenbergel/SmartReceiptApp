import {
  mapMindeePrediction,
  normalizeMindeeLineItems,
  normalizeMindeeAmount,
  normalizeMindeeDate,
  extractRawTextFromMindee,
} from '../utils/mindeeUtils.js';

describe('mindeeUtils', () => {
  it('normalizes line items from Mindee-style fields', () => {
    const lineItemsField = {
      value: [
        { description: 'Coffee', quantity: 2, unit_price: 2.5, total: 5 },
        { description: 'Croissant', total: 1.2 },
      ],
    };

    const lineItems = normalizeMindeeLineItems(lineItemsField);

    expect(lineItems).toHaveLength(2);
    expect(lineItems[0]).toMatchObject({ description: 'Coffee', quantity: 2, unitPrice: 2.5, total: 5 });
    expect(lineItems[1]).toMatchObject({ description: 'Croissant', total: 1.2 });
  });

  it('maps Mindee prediction to normalized expense data', () => {
    const fields = {
      supplier_name: { value: 'Mindee Café' },
      total_amount: { value: 12.34 },
      date: { value: '2025-03-01' },
      expense_category: { value: 'Food' },
      line_items: {
        value: [
          { description: 'Latte', quantity: 2, unit_price: 3.5, total: 7 },
        ],
      },
    };

    const inference = {
      result: {
        rawText: {
          pages: [{ content: 'Mindee Café receipt' }],
        },
      },
    };

    const response = { rawHttp: {} };

    const result = mapMindeePrediction(fields, inference, response);

    expect(result.merchant).toBe('Mindee Café');
    expect(result.amount).toBeCloseTo(12.34);
    expect(result.date).toBe('01/03/2025');
    expect(result.category).toBe('Food');
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems?.[0]).toMatchObject({ description: 'Latte', quantity: 2, unitPrice: 3.5, total: 7 });
  });

  it('normalizes amounts and dates with fallbacks', () => {
    expect(normalizeMindeeAmount('19,99€')).toBeCloseTo(19.99);
    expect(normalizeMindeeAmount({ value: '5.50' })).toBeCloseTo(5.5);

    expect(normalizeMindeeDate('2025-04-02')).toBe('02/04/2025');
    expect(normalizeMindeeDate({ day: 5, month: 4, year: 25 })).toBe('05/04/2025');
  });

  it('extracts raw text from inference candidates', () => {
    const inference = {
      result: {
        rawText: {
          pages: [{ content: 'Line 1' }, { content: 'Line 2' }],
        },
      },
    };

    expect(extractRawTextFromMindee(inference, {})).toBe('Line 1\nLine 2');
  });
});
