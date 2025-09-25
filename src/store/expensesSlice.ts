import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExpenseLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  lineItems?: ExpenseLineItem[];
}

export interface ExpensesState {
  items: Expense[];
}

const initialState: ExpensesState = {
  items: [
    {
      id: '1',
      date: '26/08/2025',
      merchant: 'Monoprix',
      amount: 23.45,
      category: 'Food',
      lineItems: [
        { description: 'Courses alimentaires', quantity: 1, total: 23.45 },
      ],
    },
    {
      id: '2',
      date: '25/08/2025',
      merchant: 'Uber',
      amount: 12.8,
      category: 'Transport',
      lineItems: [
        { description: 'Trajet centre-ville', quantity: 1, total: 12.8 },
      ],
    },
    {
      id: '3',
      date: '24/08/2025',
      merchant: 'Starbucks',
      amount: 4.9,
      category: 'Food',
      lineItems: [
        { description: 'Latte', quantity: 1, total: 4.9 },
      ],
    },
  ],
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      const payload = {
        ...action.payload,
        lineItems: action.payload.lineItems ?? [],
      };
      state.items.unshift(payload);
    },
  },
});

export const { addExpense } = expensesSlice.actions;
export const expensesReducer = expensesSlice.reducer;
