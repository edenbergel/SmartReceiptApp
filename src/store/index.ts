import { configureStore } from '@reduxjs/toolkit';

import { expensesReducer } from './expensesSlice';
import { scanReducer } from './scanSlice';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    scan: scanReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
