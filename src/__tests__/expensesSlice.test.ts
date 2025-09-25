import { addExpense, expensesReducer, type ExpensesState } from '../store/expensesSlice';

describe('expensesSlice', () => {
  it('adds an expense with line items to the front of the list', () => {
    const initialState: ExpensesState = { items: [] };

    const action = addExpense({
      id: 'exp-1',
      merchant: 'Test Merchant',
      amount: 42.5,
      category: 'Food',
      date: '01/01/2025',
      lineItems: [{ description: 'Lunch menu', quantity: 1, total: 42.5 }],
    });

    const nextState = expensesReducer(initialState, action);

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]).toMatchObject({
      id: 'exp-1',
      merchant: 'Test Merchant',
      amount: 42.5,
      category: 'Food',
      date: '01/01/2025',
    });
    expect(nextState.items[0].lineItems).toEqual(action.payload.lineItems);
  });

  it('defaults missing line items to an empty array', () => {
    const initialState: ExpensesState = { items: [] };

    const action = addExpense({
      id: 'exp-2',
      merchant: 'Coffee Shop',
      amount: 3.2,
      category: 'Food',
      date: '02/01/2025',
    });

    const nextState = expensesReducer(initialState, action);

    expect(nextState.items[0].lineItems).toEqual([]);
  });
});
