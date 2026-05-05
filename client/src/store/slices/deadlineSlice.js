import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchDeadlines = createAsyncThunk(
  'deadlines/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/deadlines', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load deadlines');
    }
  }
);

export const createDeadline = createAsyncThunk(
  'deadlines/create',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/deadlines', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create deadline');
    }
  }
);

export const updateDeadline = createAsyncThunk(
  'deadlines/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/deadlines/${id}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update deadline');
    }
  }
);

export const deleteDeadline = createAsyncThunk(
  'deadlines/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/deadlines/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete deadline');
    }
  }
);

const deadlineSlice = createSlice({
  name: 'deadlines',
  initialState: { items: [], loading: false, error: null, meta: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeadlines.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDeadlines.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchDeadlines.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createDeadline.fulfilled, (state, action) => {
        const dl = action.payload.deadline || action.payload;
        state.items.unshift(dl);
      })
      .addCase(deleteDeadline.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      });
  },
});

export default deadlineSlice.reducer;
