import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCases = createAsyncThunk(
  'cases/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/cases', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load cases');
    }
  }
);

export const getMyCases = createAsyncThunk(
  'cases/fetchMyCases',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/cases/my-cases', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch my cases');
    }
  }
);

export const fetchCase = createAsyncThunk(
  'cases/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/cases/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Case not found');
    }
  }
);

export const createCase = createAsyncThunk(
  'cases/create',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/cases', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create case');
    }
  }
);

export const updateCase = createAsyncThunk(
  'cases/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/cases/${id}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update case');
    }
  }
);

export const deleteCase = createAsyncThunk(
  'cases/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/cases/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete case');
    }
  }
);

const caseSlice = createSlice({
  name: 'cases',
  initialState: { items: [], current: null, loading: false, error: null, meta: null },
  reducers: {
    clearCurrentCase(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getMyCases.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getMyCases.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(getMyCases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCase.pending, (state) => { state.loading = true; })
      .addCase(fetchCase.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchCase.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCase.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateCase.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearCurrentCase } = caseSlice.actions;
export default caseSlice.reducer;
