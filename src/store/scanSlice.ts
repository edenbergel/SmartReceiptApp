import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ScanStatus = 'idle' | 'processing' | 'completed';

export interface ExtractedData {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  imageUri?: string;
}

interface ScanState {
  status: ScanStatus;
  extractedData?: ExtractedData;
}

const initialState: ScanState = {
  status: 'idle',
  extractedData: undefined,
};

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    startScan: (state) => {
      state.status = 'processing';
      state.extractedData = undefined;
    },
    completeScan: (state, action: PayloadAction<ExtractedData>) => {
      state.status = 'completed';
      state.extractedData = action.payload;
    },
    resetScan: (state) => {
      state.status = 'idle';
      state.extractedData = undefined;
    },
  },
});

export const { startScan, completeScan, resetScan } = scanSlice.actions;
export const scanReducer = scanSlice.reducer;
