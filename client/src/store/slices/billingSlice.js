import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchInvoices = createAsyncThunk(
  'billing/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/billing', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load invoices');
    }
  }
);

export const fetchInvoice = createAsyncThunk(
  'billing/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/billing/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invoice not found');
    }
  }
);

export const createInvoice = createAsyncThunk(
  'billing/create',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/billing', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'billing/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/billing/${id}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update invoice');
    }
  }
);

export const updateInvoiceStatus = createAsyncThunk(
  'billing/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/billing/${id}/status`, { status });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'billing/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/billing/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete invoice');
    }
  }
);

export const fetchRevenueSummary = createAsyncThunk(
  'billing/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/billing/summary');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load summary');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState: { items: [], current: null, summary: null, loading: false, error: null, meta: null },
  reducers: {
    clearCurrentInvoice(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchInvoices.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchInvoice.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoice.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchInvoice.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createInvoice.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const { clearCurrentInvoice } = billingSlice.actions;
export default billingSlice.reducer;
