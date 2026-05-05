import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientReducer from './slices/clientSlice';
import caseReducer from './slices/caseSlice';
import deadlineReducer from './slices/deadlineSlice';
import documentReducer from './slices/documentSlice';
import timeEntryReducer from './slices/timeEntrySlice';
import billingReducer from './slices/billingSlice';
import firmReducer from './slices/firmSlice';
import documentAnalysisReducer from './slices/documentAnalysisSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientReducer,
    cases: caseReducer,
    deadlines: deadlineReducer,
    documents: documentReducer,
    timeEntries: timeEntryReducer,
    billing: billingReducer,
    firm: firmReducer,
    documentAnalysis: documentAnalysisReducer,
  },
});

export default store;
