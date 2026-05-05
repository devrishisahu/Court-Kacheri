import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const triggerAnalysis = createAsyncThunk(
  'documentAnalysis/triggerAnalysis',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/documents/${documentId}/analyze`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to analyze document'
      );
    }
  }
);

export const getDocumentAnalysis = createAsyncThunk(
  'documentAnalysis/getDocumentAnalysis',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/documents/${documentId}/analysis`);
      return { documentId, data: response.data }; // Returning documentId to map easily
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch document analysis'
      );
    }
  }
);

export const clearAnalysis = createAsyncThunk(
  'documentAnalysis/clearAnalysis',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/documents/${documentId}/analysis`);
      return { documentId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear document analysis'
      );
    }
  }
);

const initialState = {
  analyses: {}, // { [documentId]: { data, loading, error } }
};

const documentAnalysisSlice = createSlice({
  name: 'documentAnalysis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // triggerAnalysis
    builder
      .addCase(triggerAnalysis.pending, (state, action) => {
        const documentId = action.meta.arg;
        if (!state.analyses[documentId]) state.analyses[documentId] = {};
        state.analyses[documentId].loading = true;
        state.analyses[documentId].error = null;
      })
      .addCase(triggerAnalysis.fulfilled, (state, action) => {
        const documentId = action.meta.arg;
        state.analyses[documentId].loading = false;
        state.analyses[documentId].data = action.payload.data;
      })
      .addCase(triggerAnalysis.rejected, (state, action) => {
        const documentId = action.meta.arg;
        state.analyses[documentId].loading = false;
        state.analyses[documentId].error = action.payload;
      });

    // getDocumentAnalysis
    builder
      .addCase(getDocumentAnalysis.pending, (state, action) => {
        const documentId = action.meta.arg;
        if (!state.analyses[documentId]) state.analyses[documentId] = {};
        state.analyses[documentId].loading = true;
        state.analyses[documentId].error = null;
      })
      .addCase(getDocumentAnalysis.fulfilled, (state, action) => {
        const documentId = action.payload.documentId;
        state.analyses[documentId].loading = false;
        state.analyses[documentId].data = action.payload.data.data;
      })
      .addCase(getDocumentAnalysis.rejected, (state, action) => {
        const documentId = action.meta.arg;
        state.analyses[documentId].loading = false;
        state.analyses[documentId].error = action.payload;
      });

    // clearAnalysis
    builder
      .addCase(clearAnalysis.pending, (state, action) => {
        const documentId = action.meta.arg;
        if (state.analyses[documentId]) {
          state.analyses[documentId].loading = true;
        }
      })
      .addCase(clearAnalysis.fulfilled, (state, action) => {
        const documentId = action.payload.documentId;
        if (state.analyses[documentId]) {
          state.analyses[documentId].data = null;
          state.analyses[documentId].loading = false;
        }
      })
      .addCase(clearAnalysis.rejected, (state, action) => {
        const documentId = action.meta.arg;
        if (state.analyses[documentId]) {
          state.analyses[documentId].loading = false;
          state.analyses[documentId].error = action.payload;
        }
      });
  },
});

export default documentAnalysisSlice.reducer;
