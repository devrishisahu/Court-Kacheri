import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchFirm = createAsyncThunk(
  'firm/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/firms/me');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load firm');
    }
  }
);

export const createFirm = createAsyncThunk(
  'firm/create',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/firms/create', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create firm');
    }
  }
);

const firmSlice = createSlice({
  name: 'firm',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFirm.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFirm.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchFirm.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createFirm.fulfilled, (state, action) => { state.data = action.payload; });
  },
});

export default firmSlice.reducer;
