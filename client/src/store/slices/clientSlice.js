import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/clients', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load clients');
    }
  }
);

export const fetchClient = createAsyncThunk(
  'clients/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/clients/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Client not found');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/clients', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/clients/${id}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete client');
    }
  }
);

const clientSlice = createSlice({
  name: 'clients',
  initialState: { items: [], current: null, loading: false, error: null, meta: null },
  reducers: {
    clearCurrentClient(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchClients.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchClient.pending, (state) => { state.loading = true; })
      .addCase(fetchClient.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchClient.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createClient.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearCurrentClient } = clientSlice.actions;
export default clientSlice.reducer;
