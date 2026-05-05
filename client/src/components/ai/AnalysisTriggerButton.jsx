import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Loader2, Play } from 'lucide-react';
import { triggerAnalysis } from '../../store/slices/documentAnalysisSlice';

const AnalysisTriggerButton = ({ documentId, mimeType, existingStatus }) => {
  const dispatch = useDispatch();
  const [localLoading, setLocalLoading] = useState(false);

  // Read analysis state
  const analysisState = useSelector((state) => state.documentAnalysis.analyses[documentId]);
  const isGlobalLoading = analysisState?.loading;

  if (mimeType !== 'application/pdf') {
    return (
      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
        AI PDF Only
      </span>
    );
  }

  const isLoading = localLoading || isGlobalLoading;
  const isCompleted = existingStatus === 'completed' || analysisState?.data?.status === 'completed';

  const handleAnalyze = async () => {
    setLocalLoading(true);
    await dispatch(triggerAnalysis(documentId));
    setLocalLoading(false);
  };

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full animate-pulse border border-amber-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Analyzing...
      </span>
    );
  }

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
        <Sparkles className="w-3 h-3 text-purple-600" />
        AI Evaluated
      </span>
    );
  }

  return (
    <button
      onClick={handleAnalyze}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors border border-blue-200 hover:border-blue-300 group"
      title="Run Gemini AI Analysis"
    >
      <Play className="w-3 h-3 text-blue-600 group-hover:scale-110 transition-transform" />
      Analyze File
    </button>
  );
};

export default AnalysisTriggerButton;
