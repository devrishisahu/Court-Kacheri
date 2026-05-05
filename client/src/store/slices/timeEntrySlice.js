import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchTimeEntries = createAsyncThunk(
  'timeEntries/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/time-entries', { params });
      return { items: data.data || [], meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load time entries');
    }
  }
);

export const getMySummary = createAsyncThunk(
  'timeEntries/fetchMySummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/time-entries/my-summary');
      return data.data; // { totalHours, billableHours, totalEntries }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch my summary');
    }
  }
);

export const startTimer = createAsyncThunk(
  'timeEntries/start',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/time-entries/start', body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start timer');
    }
  }
);

export const stopTimer = createAsyncThunk(
  'timeEntries/stop',
  async ({ id, description }, { rejectWithValue }) => {
    try {
      const body = description ? { description } : {};
      const { data } = await api.post(`/time-entries/${id}/stop`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to stop timer');
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'timeEntries/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/time-entries/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete time entry');
    }
  }
);

const timeEntrySlice = createSlice({
  name: 'timeEntries',
  initialState: { items: [], activeTimer: null, mySummary: null, loading: false, error: null, meta: null },
  reducers: {
    clearActiveTimer(state) {
      state.activeTimer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeEntries.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        // Detect active timer
        const active = action.payload.items.find((e) => !e.endTime);
        state.activeTimer = active || null;
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getMySummary.fulfilled, (state, action) => {
        state.mySummary = action.payload;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.activeTimer = action.payload;
      })
      .addCase(stopTimer.fulfilled, (state, action) => {
        state.activeTimer = null;
        const idx = state.items.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e._id !== action.payload);
        if (state.activeTimer?._id === action.payload) state.activeTimer = null;
      });
  },
});

export const { clearActiveTimer } = timeEntrySlice.actions;
export default timeEntrySlice.reducer;
