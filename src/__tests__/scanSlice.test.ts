import { completeScan, resetScan, scanReducer, startScan, type ExtractedData } from '../store/scanSlice';

describe('scanSlice', () => {
  it('marks status as processing when a scan starts', () => {
    const nextState = scanReducer(undefined, startScan());
    expect(nextState.status).toBe('processing');
    expect(nextState.extractedData).toBeUndefined();
  });

  it('stores extracted data when a scan completes', () => {
    const payload: ExtractedData = {
      merchant: 'Mindee Test',
      amount: 10.5,
      category: 'Food',
      date: '2025-01-03',
      rawText: 'Sample receipt',
      lineItems: [{ description: 'Sandwich', quantity: 1, total: 10.5 }],
    };

    const nextState = scanReducer(undefined, completeScan(payload));

    expect(nextState.status).toBe('completed');
    expect(nextState.extractedData).toEqual(payload);
  });

  it('resets status and data', () => {
    const inProgress = scanReducer(undefined, startScan());
    const completed = scanReducer(inProgress, completeScan({
      merchant: 'Reset Test',
      amount: 5,
      category: 'Other',
      date: '2025-01-04',
    }));

    const resetState = scanReducer(completed, resetScan());

    expect(resetState.status).toBe('idle');
    expect(resetState.extractedData).toBeUndefined();
  });
});
