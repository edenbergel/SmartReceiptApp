import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
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
    },
    {
      id: '2',
      date: '25/08/2025',
      merchant: 'Uber',
      amount: 12.8,
      category: 'Transport',
    },
    {
      id: '3',
      date: '24/08/2025',
      merchant: 'Starbucks',
      amount: 4.9,
      category: 'Food',
    },
  ],
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.items.unshift(action.payload);
    },
  },
});

export const { addExpense } = expensesSlice.actions;
export const expensesReducer = expensesSlice.reducer;
