import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BrainCircuit,
  FileWarning,
  CalendarClock,
  Scale,
  Target,
  Users,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  getDocumentAnalysis,
  clearAnalysis,
} from '../../store/slices/documentAnalysisSlice';

const RiskBadge = ({ level }) => {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  const iconColors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-emerald-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${
        colors[level] || colors.medium
      }`}
    >
      <AlertTriangle className={`w-3.5 h-3.5 ${iconColors[level]}`} />
      {level} Risk
    </span>
  );
};

const DocumentAnalysisPanel = ({ documentId, fileName }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const analysisState = useSelector((state) => state.documentAnalysis.analyses[documentId]);
  const analysis = analysisState?.data;
  const isLoading = analysisState?.loading;
  const error = analysisState?.error;

  useEffect(() => {
    dispatch(getDocumentAnalysis(documentId));
  }, [documentId, dispatch]);

  const handleClear = async () => {
    if (window.confirm('Delete this AI analysis? You will have to re-run it.')) {
      await dispatch(clearAnalysis(documentId));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100 mt-4 animate-pulse">
        <BrainCircuit className="w-8 h-8 text-indigo-300 mx-auto mb-3 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving AI Intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl mt-4 text-sm border border-red-100">
        <FileWarning className="w-5 h-5 mb-2" />
        {error}
      </div>
    );
  }

  if (!analysis) return null;

  if (analysis.status === 'failed') {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl mt-4 border border-red-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
           <FileWarning className="w-6 h-6 text-red-500" />
           <h3 className="font-bold text-lg">AI Processing Failed</h3>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl">{analysis.errorMessage || 'An unknown error occurred while analyzing the document.'}</p>
        <p className="text-xs text-red-500 mt-4 italic">Please check if the Gemini API Key is configured in the backend environment variables.</p>
        {(user?.role === 'admin' || true) && (
          <button onClick={handleClear} className="mt-5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium text-sm transition-colors border border-red-200">
            Clear Analysis & Try Again
          </button>
        )}
      </div>
    );
  }

  if (analysis.status === 'processing' || analysis.status === 'pending') {
    return (
      <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-slate-100 mt-4 animate-pulse">
        <BrainCircuit className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Analyzing Document...</h3>
        <p className="text-sm text-slate-500">The AI is currently evaluating the contents. This may take a few moments safely scan the entire file.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <BrainCircuit className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-1 rounded text-xs font-semibold tracking-wider uppercase">
                Gemini Intelligence
              </span>
              <span className="text-indigo-200 text-sm">{analysis.documentType || 'Document'}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Automated Evaluation</h3>
            <p className="text-indigo-100/80 text-sm hidden md:block">
              Analyzed {fileName} in {(analysis.processingTimeMs / 1000).toFixed(1)}s
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <RiskBadge level={analysis.riskLevel} />
            {user?.role === 'admin' && (
              <button
                onClick={handleClear}
                className="p-2 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                title="Delete Analysis"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Executive Summary & Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Executive Summary
            </h4>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed">
              {(analysis.executiveSummary || 'No summary available.').split('\n').map((paragraph, i) => (
                <p key={i} className="mb-3">{paragraph}</p>
              ))}
            </div>
            <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
              <p className="text-xs text-orange-800 font-medium">Risk Rationale:</p>
              <p className="text-sm text-orange-900 mt-1">{analysis.riskRationale}</p>
            </div>
          </div>

          {/* Key Meta Information */}
          <div className="space-y-6">
            {analysis.parties?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Identified Parties
                </h4>
                <ul className="space-y-2">
                  {analysis.parties.map((party, i) => (
                    <li key={i} className="flex flex-col text-sm bg-slate-50 rounded px-3 py-2 border border-slate-100">
                      <span className="font-semibold text-slate-700">{party.name}</span>
                      <span className="text-xs text-slate-500">{party.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.actionItems?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Required Actions
                </h4>
                <ul className="space-y-2">
                  {analysis.actionItems.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm items-start">
                      <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                        item.urgency === 'immediate' ? 'bg-red-500' :
                        item.urgency === 'soon' ? 'bg-amber-400' : 'bg-blue-400'
                      }`} />
                      <span className="text-slate-600 leading-tight">{item.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Legal Breakdown & Clauses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" /> Legal Breakdown
            </h4>
            <div className="space-y-3">
              {analysis.clauses?.map((clause, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h5 className="font-semibold text-slate-900 leading-snug">{clause.title}</h5>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap bg-slate-100 text-slate-600`}>
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* References */}
            {analysis.legalReferences?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-indigo-500" /> Cited References
                </h4>
                <div className="space-y-3">
                  {analysis.legalReferences.map((ref, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <div className="font-semibold text-indigo-900 text-sm mb-1">{ref.section}</div>
                      <p className="text-xs text-indigo-800/80 mb-2">{ref.description}</p>
                      <div className="text-xs bg-white px-2 py-1.5 rounded text-slate-600 border border-slate-100">
                        {ref.relevance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timelines */}
            {analysis.keyDates?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-indigo-500" /> Key Dates
                </h4>
                <div className="space-y-2">
                  {analysis.keyDates.map((kd, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="font-mono text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {kd.date}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{kd.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{kd.context}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Warning */}
        <div className="bg-slate-50 text-slate-500 text-xs p-4 rounded-lg flex items-center gap-2 border border-slate-100 italic">
          <BrainCircuit className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <p>
            This summary was generated by artificial intelligence. While designed to accurately reflect the contents of the document, AI can make mistakes. Always consult the original source document for verified legal facts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisPanel;
