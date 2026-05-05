import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// ─── Async Thunks ─────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      const { token, ...userData } = data.data;
      localStorage.setItem('ck_token', token);
      localStorage.setItem('ck_user', JSON.stringify(userData));
      return { user: userData, token, flagMessage: data.data.flagMessage };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, firmName, role }, { rejectWithValue }) => {
    try {
      const body = { name, email, password, role };
      if (firmName?.trim()) body.firmName = firmName.trim();
      const { data } = await api.post('/auth/register', body);
      const { token, ...userData } = data.data;
      localStorage.setItem('ck_token', token);
      localStorage.setItem('ck_user', JSON.stringify(userData));
      return { user: userData, token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const googleAuth = createAsyncThunk(
  'auth/google',
  async ({ credential, role, firmName }, { rejectWithValue }) => {
    try {
      const body = { credential, role };
      if (firmName?.trim()) body.firmName = firmName.trim();
      const { data } = await api.post('/auth/google', body);
      const { token, ...userData } = data.data;
      localStorage.setItem('ck_token', token);
      localStorage.setItem('ck_user', JSON.stringify(userData));
      return { user: userData, token, flagMessage: data.data.flagMessage };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Google authentication failed');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────

const loadInitialState = () => {
  try {
    const token = localStorage.getItem('ck_token');
    const user = localStorage.getItem('ck_user');
    if (token && user) {
      return { user: JSON.parse(user), token, loading: false, error: null };
    }
  } catch {
    localStorage.removeItem('ck_token');
    localStorage.removeItem('ck_user');
  }
  return { user: null, token: null, loading: false, error: null };
};

// ─── Slice ────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('ck_token');
      localStorage.removeItem('ck_user');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Google Auth
    builder
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Fetch me
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
