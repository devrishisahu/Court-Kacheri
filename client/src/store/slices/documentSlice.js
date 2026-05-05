import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (caseId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/documents/${caseId}`);
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load documents');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async ({ file, caseId }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caseId', caseId);
      const { data } = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Upload failed');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/documents/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState: { items: [], loading: false, uploading: false, error: null },
  reducers: {
    clearDocuments(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(uploadDocument.pending, (state) => { state.uploading = true; })
      .addCase(uploadDocument.fulfilled, (state, action) => { state.uploading = false; state.items.unshift(action.payload); })
      .addCase(uploadDocument.rejected, (state, action) => { state.uploading = false; state.error = action.payload; })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      });
  },
});

export const { clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;
